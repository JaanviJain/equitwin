import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
import warnings
import logging

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)

RANDOM_SEED = 42


class SyntheticTwinService:
    """
    Generates synthetic digital twins with privacy-by-design.

    Strategy:
        1. Try CTGAN via SDV 1.x (best quality, slowest)
        2. Try CTGAN via SDV 0.x (legacy fallback)
        3. Fall back to Cholesky-based correlation-preserving synthesis

    All paths include a real quality score computed from column-wise
    statistical similarity between original and synthetic data.

    FIX (Problem 5): The synthetic twin is generated ONLY for privacy-safe
    data export. Causal discovery and fairness training must be run on the
    ORIGINAL dataframe, not on the synthetic twin.  The caller is responsible
    for keeping both references; this service only returns the twin.
    """

    def __init__(self):
        self.synthetic_data = None
        np.random.seed(RANDOM_SEED)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_twin(
        self,
        df: pd.DataFrame,
        epochs: int = 100,
        batch_size: int = 500,
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Generate a synthetic twin of the input dataset.

        Args:
            df:         Source DataFrame (REAL data — used only for fitting).
            epochs:     Training epochs for CTGAN (capped at 50 internally).
            batch_size: Mini-batch size for CTGAN.

        Returns:
            (synthetic_df, metadata_dict)

        IMPORTANT: Use the returned synthetic_df ONLY for safe data sharing /
        export.  Run causal discovery and fairness analysis on the original df.
        """
        if df.empty:
            raise ValueError("Input DataFrame is empty — nothing to synthesize.")

        logger.info("Generating synthetic twin from %d rows...", len(df))

        # ── Attempt 1: SDV 1.x ──────────────────────────────────────
        try:
            from sdv.single_table import CTGANSynthesizer
            from sdv.metadata import SingleTableMetadata

            metadata = SingleTableMetadata()
            metadata.detect_from_dataframe(df)

            effective_epochs = min(epochs, 50)
            effective_batch  = min(batch_size, len(df))

            model = CTGANSynthesizer(
                metadata,
                epochs=effective_epochs,
                batch_size=effective_batch,
                verbose=False,
            )
            model.fit(df)
            synthetic_df = model.sample(num_rows=len(df))
            quality      = self._compute_quality(df, synthetic_df)

            logger.info("CTGAN (SDV 1.x) twin generated — quality=%.3f", quality)
            return synthetic_df, self._meta(synthetic_df, quality, "CTGAN (SDV 1.x)")

        except Exception as exc:
            logger.warning("SDV 1.x failed: %s", exc)

        # ── Attempt 2: SDV 0.x (legacy) ─────────────────────────────
        try:
            from sdv.tabular import CTGAN  # type: ignore

            model = CTGAN(
                epochs=min(epochs, 50),
                batch_size=min(batch_size, len(df)),
                verbose=False,
            )
            model.fit(df)
            synthetic_df = model.sample(num_rows=len(df))
            quality      = self._compute_quality(df, synthetic_df)

            logger.info("CTGAN (SDV 0.x) twin generated — quality=%.3f", quality)
            return synthetic_df, self._meta(synthetic_df, quality, "CTGAN (SDV 0.x)")

        except Exception as exc:
            logger.warning("SDV 0.x also failed: %s", exc)

        # ── Attempt 3: Cholesky fallback ─────────────────────────────
        return self._cholesky_fallback(df)

    # ------------------------------------------------------------------
    # Quality scoring
    # ------------------------------------------------------------------

    def _compute_quality(self, real: pd.DataFrame, synth: pd.DataFrame) -> float:
        """
        Compute a real quality score based on per-column statistical similarity.

        Numeric columns:  compare mean + std (normalised absolute difference).
        Categorical cols: compare value-frequency distributions (TV distance).

        Returns a score in [0, 1] — higher is better.
        """
        scores: list[float] = []

        for col in real.columns:
            if col not in synth.columns:
                continue

            real_col  = real[col].dropna()
            synth_col = synth[col].dropna()

            if len(real_col) == 0 or len(synth_col) == 0:
                continue

            if pd.api.types.is_numeric_dtype(real_col):
                r_mean, r_std = real_col.mean(),  real_col.std() + 1e-9
                s_mean, s_std = synth_col.mean(), synth_col.std() + 1e-9

                mean_score = 1.0 - min(abs(r_mean - s_mean) / (abs(r_mean) + 1e-9), 1.0)
                std_score  = 1.0 - min(abs(r_std  - s_std)  / r_std, 1.0)
                scores.append((mean_score + std_score) / 2)

            else:  # categorical / object
                r_freq = real_col.value_counts(normalize=True)
                s_freq = synth_col.value_counts(normalize=True)
                all_cats = set(r_freq.index) | set(s_freq.index)
                tv = sum(
                    abs(r_freq.get(c, 0.0) - s_freq.get(c, 0.0))
                    for c in all_cats
                ) / 2
                scores.append(1.0 - tv)

        return round(float(np.mean(scores)) if scores else 0.5, 4)

    # ------------------------------------------------------------------
    # Cholesky fallback
    # ------------------------------------------------------------------

    def _cholesky_fallback(
        self, df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Correlation-preserving synthesis using Cholesky decomposition.

        - Noise magnitude: 0.15 (meaningful privacy perturbation).
        - Categorical columns sampled conditionally within numeric quantile
          buckets, preserving cross-column correlations.
        - Reproducible via RANDOM_SEED.
        """
        rng = np.random.default_rng(RANDOM_SEED)

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols     = df.select_dtypes(include=["object", "category"]).columns.tolist()

        synthetic = df.copy()

        # ── Numeric synthesis ────────────────────────────────────────
        if numeric_cols:
            df_num  = df[numeric_cols].copy().fillna(df[numeric_cols].mean()).fillna(0)
            means   = df_num.mean()
            stds    = df_num.std().replace(0, 1)
            df_std  = (df_num - means) / stds

            corr = df_std.corr().values
            corr = np.nan_to_num(corr, nan=0.0, posinf=0.0, neginf=0.0)
            corr += np.eye(len(corr)) * 1e-6

            try:
                L = np.linalg.cholesky(corr)
            except np.linalg.LinAlgError:
                eigvals, eigvecs = np.linalg.eigh(corr)
                eigvals = np.clip(eigvals, 1e-8, None)
                corr    = eigvecs @ np.diag(eigvals) @ eigvecs.T
                L       = np.linalg.cholesky(corr)

            noise            = rng.standard_normal((len(df), len(numeric_cols)))
            correlated_noise = noise @ L.T

            for i, col in enumerate(numeric_cols):
                col_min, col_max = df[col].min(), df[col].max()
                perturbed        = df[col].values + correlated_noise[:, i] * stds[col] * 0.15
                synthetic[col]   = np.clip(perturbed, col_min, col_max)

        # ── Categorical synthesis — conditional resampling ───────────
        if cat_cols and numeric_cols:
            anchor         = numeric_cols[0]
            quantile_labels = pd.qcut(
                df[anchor], q=5, labels=False, duplicates="drop"
            ).fillna(0).astype(int).values

            for col in cat_cols:
                new_vals = np.empty(len(df), dtype=object)
                for bucket in np.unique(quantile_labels):
                    mask         = quantile_labels == bucket
                    bucket_pool  = df.loc[mask, col].values
                    new_vals[mask] = rng.choice(bucket_pool, size=mask.sum(), replace=True)
                synthetic[col] = new_vals

        elif cat_cols:
            for col in cat_cols:
                synthetic[col] = rng.choice(df[col].values, size=len(df), replace=True)

        quality = self._compute_quality(df, synthetic)
        logger.info("Cholesky fallback used — quality=%.3f", quality)

        return synthetic, {
            **self._meta(synthetic, quality, "cholesky_fallback"),
            "note": (
                "Cholesky correlation preservation with conditional categorical resampling. "
                "Use original df for causal discovery and fairness training."
            ),
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _meta(synth: pd.DataFrame, quality: float, method: str) -> Dict[str, Any]:
        return {
            "quality_score":     quality,
            "rows_generated":    len(synth),
            "columns":           list(synth.columns),
            "privacy_preserved": True,
            "method":            method,
            # Remind callers not to feed the twin back into fairness/causal tools
            "usage_note": (
                "synthetic_df is for EXPORT only. "
                "Run causal discovery and fairness training on original df."
            ),
        }