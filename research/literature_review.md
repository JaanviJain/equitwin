# EquiTwin Research Foundation

## Key Academic Papers This Project Builds Upon

### Causal Fairness
1. **Kusner et al. (2017)** - "Counterfactual Fairness"
   - Introduced counterfactual fairness definition
   - We implement this in our gymnasium reward function

2. **Zhang & Bareinboim (2018)** - "Fairness in Decision-Making — The Causal Explanation Formula"
   - Causal pathways for discrimination
   - Our LiNGAM/PC implementation directly applies this

### Adversarial Fairness
3. **Madras et al. (2018)** - "Learning Adversarially Fair and Transferable Representations"
   - Adversarial training for fairness
   - Extended in our multi-agent gymnasium

### Synthetic Data for Privacy
4. **Xu et al. (2019)** - "Modeling Tabular Data using Conditional GAN"
   - CTGAN architecture we implement
   - Privacy guarantees for synthetic data

### Verifiable Credentials
5. **W3C (2022)** - "Verifiable Credentials Data Model v1.1"
   - Standards compliance for our certification

## Why Our Approach is Novel
- **Existing tools** (AI Fairness 360, Fairlearn): Only detect correlation-based bias
- **Academic papers**: Propose causal methods but don't build deployable tools
- **EquiTwin**: Combines causal discovery + adversarial training + cryptographic verification in one system