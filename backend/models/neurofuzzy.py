import torch
import torch.nn as nn

class NeuroFuzzyNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(6, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU()
        )
        self.probability_head = nn.Linear(8, 1)
        self.severity_head = nn.Linear(8, 1)
        self.class_head = nn.Linear(8, 3) # outputs: Mild, Moderate, Severe

    def forward(self, x):
        features = self.network(x)
        probability = torch.sigmoid(self.probability_head(features))
        severity = torch.sigmoid(self.severity_head(features)) * 100.0
        severity_class_logits = self.class_head(features)
        return probability, severity, severity_class_logits
