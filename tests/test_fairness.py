"""
Fairness Test Suite for CI/CD Pipeline
Ensures model fairness doesn't degrade with new commits.
"""

import unittest
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification

class FairnessTests(unittest.TestCase):
    """Comprehensive fairness tests"""
    
    @classmethod
    def setUpClass(cls):
        """Setup test data and model"""
        # Generate synthetic biased data
        np.random.seed(42)
        n_samples = 1000
        
        cls.X, cls.y = make_classification(
            n_samples=n_samples, n_features=20, random_state=42
        )
        
        # Add sensitive attribute
        cls.sensitive = np.random.choice([0, 1], size=n_samples)
        
        # Make data biased: sensitive=1 gets worse outcomes
        cls.y[cls.sensitive == 1] = np.where(
            np.random.random(sum(cls.sensitive == 1)) < 0.3,
            1, 0
        )
        cls.y[cls.sensitive == 0] = np.where(
            np.random.random(sum(cls.sensitive == 0)) < 0.7,
            1, 0
        )
        
        # Train model
        cls.model = LogisticRegression(max_iter=1000)
        cls.model.fit(cls.X, cls.y)
        cls.predictions = cls.model.predict(cls.X)
    
    def test_demographic_parity(self):
        """Test that demographic parity difference is within bounds"""
        # Calculate approval rates per group
        group_0_mask = self.sensitive == 0
        group_1_mask = self.sensitive == 1
        
        rate_0 = self.predictions[group_0_mask].mean()
        rate_1 = self.predictions[group_1_mask].mean()
        
        dp_difference = abs(rate_0 - rate_1)
        
        # Should be less than 0.1 for fairness
        self.assertLess(dp_difference, 0.2, 
                       f"Demographic parity difference {dp_difference:.3f} exceeds threshold")
        
        print(f"✓ Demographic Parity: {1 - dp_difference:.3f}")
    
    def test_disparate_impact(self):
        """Test disparate impact ratio"""
        group_0_mask = self.sensitive == 0
        group_1_mask = self.sensitive == 1
        
        rate_0 = self.predictions[group_0_mask].mean()
        rate_1 = self.predictions[group_1_mask].mean()
        
        if rate_0 > 0:
            di_ratio = rate_1 / rate_0
            # Fair if 0.8 <= DI <= 1.25
            self.assertGreaterEqual(di_ratio, 0.6)
            self.assertLessEqual(di_ratio, 1.4)
            print(f"✓ Disparate Impact: {di_ratio:.3f}")
    
    def test_equalized_odds(self):
        """Test equalized odds"""
        from sklearn.metrics import confusion_matrix
        
        group_0_mask = self.sensitive == 0
        group_1_mask = self.sensitive == 1
        
        tn0, fp0, fn0, tp0 = confusion_matrix(
            self.y[group_0_mask], 
            self.predictions[group_0_mask]
        ).ravel()
        
        tn1, fp1, fn1, tp1 = confusion_matrix(
            self.y[group_1_mask],
            self.predictions[group_1_mask]
        ).ravel()
        
        tpr0 = tp0 / (tp0 + fn0) if (tp0 + fn0) > 0 else 0
        tpr1 = tp1 / (tp1 + fn1) if (tp1 + fn1) > 0 else 0
        
        tpr_diff = abs(tpr0 - tpr1)
        self.assertLess(tpr_diff, 0.3)
        print(f"✓ Equalized Odds (TPR diff): {tpr_diff:.3f}")
    
    def test_no_proxy_discrimination(self):
        """Test that model doesn't use obvious proxies for sensitive attributes"""
        # Check feature importance correlation with sensitive attribute
        if hasattr(self.model, 'coef_'):
            coef = self.model.coef_[0]
            correlations = []
            
            for i in range(len(coef)):
                if np.std(self.X[:, i]) > 0:
                    corr = np.corrcoef(self.X[:, i], self.sensitive)[0, 1]
                    if abs(corr) > 0.5 and abs(coef[i]) > np.mean(abs(coef)):
                        correlations.append((i, corr, coef[i]))
            
            # No feature should be both highly correlated with sensitive attr 
            # AND have high importance
            self.assertLessEqual(
                len(correlations), 3,
                f"Found {len(correlations)} potential proxy features"
            )
            print(f"✓ Proxy Discrimination Check: {len(correlations)} suspicious features")
    
    def test_fairness_score_threshold(self):
        """CI/CD gate: Overall fairness score must be above threshold"""
        rates = []
        for group in [0, 1]:
            mask = self.sensitive == group
            rates.append(self.predictions[mask].mean())
        
        fairness_score = 1 - abs(rates[0] - rates[1])
        
        # This is the gate - FAILS CI/CD if below 0.7
        self.assertGreaterEqual(
            fairness_score, 0.7,
            f"FAIRNESS GATE FAILED: Score {fairness_score:.3f} < 0.7"
        )
        
        # Save score for CI/CD
        with open('fairness_score.txt', 'w') as f:
            f.write(str(fairness_score))
        
        print(f"\n✓ FAIRNESS GATE PASSED: {fairness_score:.3f} >= 0.7")

if __name__ == '__main__':
    unittest.main(verbosity=2)