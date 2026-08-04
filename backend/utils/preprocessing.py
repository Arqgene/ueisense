from models.fuzzy_reasoning import FuzzyReasoning

def extract_row_fuzzy_features(row):
    """
    Extracts the 6 fuzzy features from a dictionary or pandas row.
    Handles potential key differences or casing, returning a list of 6 values.
    """
    # Instantiate fuzzy reasoner
    fuzzy = FuzzyReasoning()
    
    # Get values, fallback to 0 or defaults if not present
    redness = float(row.get("redness_score", 0))
    pain = float(row.get("pain_score", 0))
    photophobia = float(row.get("photophobia_score", 0))
    
    blurred = float(row.get("blurred_vision_score", 0))
    floaters = float(row.get("floaters", 0))
    glare = float(row.get("glare_halos", 0))
    peripheral = float(row.get("peripheral_vision_loss", 0))
    
    rheumatoid = float(row.get("rheumatoid_arthritis", 0))
    psoriasis = float(row.get("psoriasis", 0))
    ibd = float(row.get("inflammatory_bowel_disease", 0))
    ankylosing = float(row.get("ankylosing_spondylitis", 0))
    sarcoidosis = float(row.get("sarcoidosis", 0))
    
    tuberculosis = float(row.get("tuberculosis", 0))
    syphilis = float(row.get("syphilis", 0))
    # Handle hiv_immunocompromised and frontend immunocompromised
    hiv = float(row.get("hiv_immunocompromised", row.get("immunocompromised", 0)))
    recent_infection = float(row.get("recent_infection", 0))
    
    similar_episodes = float(row.get("similar_episode_before", 0))
    previous_uveitis = float(row.get("previous_uveitis", 0))
    family_uveitis = float(row.get("family_uveitis", 0))
    
    onset_type = row.get("onset_type", "Sudden")
    
    # Calculate index scores (0.0 to 1.0)
    inf = fuzzy.inflammation_index(redness, pain, photophobia)
    vis = fuzzy.visual_impairment_index(blurred, floaters, glare, peripheral)
    auto = fuzzy.autoimmune_index(rheumatoid, psoriasis, ibd, ankylosing, sarcoidosis)
    infec = fuzzy.infection_index(tuberculosis, syphilis, hiv, recent_infection)
    rec = fuzzy.recurrence_index(similar_episodes, previous_uveitis, family_uveitis)
    urg = fuzzy.urgency_index(pain, photophobia, blurred, onset_type)
    
    return [inf, vis, auto, infec, rec, urg]
