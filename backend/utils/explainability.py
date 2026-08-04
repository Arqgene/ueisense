def generate_explanations(row, fuzzy_indices):
    """
    Generates clinical explanation statements based on the questionnaire answers and calculated fuzzy indices.
    """
    explanations = []
    
    # Urgency & Inflammation
    if fuzzy_indices.get("urgency", 0.0) > 0.65:
        explanations.append("High clinical urgency detected due to sudden onset of severe ocular symptoms.")
    elif fuzzy_indices.get("inflammation", 0.0) > 0.6:
        explanations.append("Elevated ocular inflammation index detected (high pain, redness, or light sensitivity).")
        
    if float(row.get("pain_score", 0)) >= 8:
        explanations.append("Severe ocular pain reported.")
    if float(row.get("photophobia_score", 0)) >= 8:
        explanations.append("Severe sensitivity to light (photophobia) reported.")
        
    # Visual Dysfunction
    if fuzzy_indices.get("visual", 0.0) > 0.5:
        explanations.append("Significant visual dysfunction flagged (blurred vision, glare/halos, or floaters).")
        
    # Autoimmune Markers
    if fuzzy_indices.get("autoimmune", 0.0) > 0.0:
        explanations.append("Active systemic autoimmune risk markers present (e.g. Rheumatoid Arthritis, Ankylosing Spondylitis).")
        
    # Infection Markers
    if fuzzy_indices.get("infectious", 0.0) > 0.0:
        explanations.append("Potential infectious risk factors or history of exposure detected (e.g. TB, Syphilis, recent infection).")
        
    # Recurrence Profile
    if fuzzy_indices.get("recurrence", 0.0) > 0.4:
        explanations.append("Elevated recurrence risk profile (prior history of uveitis, steroid eye drop use, or family history).")
        
    # Default fallback
    if not explanations:
        explanations.append("Ocular indices are within stable baseline parameters. No severe inflammatory markers detected.")
        
    return explanations
