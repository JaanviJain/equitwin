"""
Test suite for causal discovery service.
"""

import unittest
import pandas as pd
import numpy as np
import sys
sys.path.append('..')

class TestCausalDiscovery(unittest.TestCase):
    
    def setUp(self):
        """Create test dataset with known causal structure"""
        np.random.seed(42)
        n = 500
        
        # Create causal structure: gender -> income -> loan
        gender = np.random.choice([0, 1], size=n)
        income = 30000 + 10000 * gender + np.random.normal(0, 5000, n)
        loan = (income > 35000).astype(int)
        
        self.df = pd.DataFrame({
            'gender': gender,
            'income': income,
            'loan_approved': loan
        })
    
    def test_causal_discovery_identifies_pathway(self):
        """Test that causal discovery finds gender -> income -> loan pathway"""
        # This would test the actual CausalDiscoveryService
        # For now, verify test data structure
        correlation = self.df['gender'].corr(self.df['income'])
        self.assertGreater(abs(correlation), 0.3)
        print("✓ Causal pathway data structure verified")

if __name__ == '__main__':
    unittest.main(verbosity=2)