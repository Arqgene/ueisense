def right_shoulder(x, a, b):
    """
    Right-shoulder membership function. Returns 0.0 for x <= a,
    1.0 for x >= b, and scales linearly in between.
    """
    if x <= a:
        return 0.0
    if x >= b:
        return 1.0
    return float((x - a) / (b - a))

def hedge(value, kind="normal"):
    """
    Applies a linguistic hedge to adjust the membership value.
    """
    if kind == "very":
        return float(value ** 2)
    if kind == "somewhat":
        return float(value ** 0.5)
    if kind == "more_or_less":
        return float(value * 0.7)
    return float(value)

class FuzzyReasoning:
    def inflammation_index(self, redness, pain, photophobia):
        redness_high = right_shoulder(redness, 5, 8)
        pain_high = right_shoulder(pain, 5, 8)
        photo_high = right_shoulder(photophobia, 5, 8)
        score = redness_high * 0.35 + pain_high * 0.35 + photo_high * 0.30
        return float(score)

    def visual_impairment_index(self, blurred, floaters, glare, peripheral_vision_loss, hazy_vision=0.0):
        blur_high = right_shoulder(blurred, 5, 8)
        # Apply hedges to uncertain patient visual symptoms
        floaters_hedged = hedge(floaters, "very")
        hazy_hedged = hedge(hazy_vision, "very")   # visual distortion / wavy lines
        glare_hedged = hedge(glare, "somewhat")
        peripheral_hedged = hedge(peripheral_vision_loss, "very")
        
        # Weights: blur 0.30, floaters 0.20, hazy 0.15, glare 0.20, peripheral 0.15
        score = (blur_high * 0.30 + floaters_hedged * 0.20 + hazy_hedged * 0.15
                 + glare_hedged * 0.20 + peripheral_hedged * 0.15)
        return float(score)

    def autoimmune_index(self, rheumatoid, psoriasis, ibd, ankylosing, sarcoidosis):
        score = (rheumatoid + psoriasis + ibd + ankylosing + sarcoidosis) / 5.0
        return float(score)

    def infection_index(self, tuberculosis, syphilis, hiv, recent_infection):
        score = (tuberculosis + syphilis + hiv + recent_infection) / 4.0
        return float(score)

    def recurrence_index(self, similar_episode_before, previous_uveitis, family_uveitis, episode_count=0):
        """
        similar_episode_before: 0/1 binary — has had a prior episode
        previous_uveitis:       0/1 binary — clinician-confirmed prior uveitis
        family_uveitis:         0/1 binary — family history
        episode_count:          raw count (will be capped at 10 and normalised to 0-1)
        """
        prior_flag = float(similar_episode_before)
        family_hedged = hedge(family_uveitis, "more_or_less")
        # Normalise episode count: 0→0, 1→0.1 … ≥10→1.0; then hedge
        episode_norm = min(float(episode_count), 10.0) / 10.0
        episode_hedged = hedge(episode_norm, "somewhat")  # square-root: softens extreme counts
        score = (previous_uveitis * 0.45 + family_hedged * 0.25
                 + prior_flag * 0.15 + episode_hedged * 0.15)
        return float(score)

    def urgency_index(self, pain, photophobia, blurred, onset_type):
        pain_high = right_shoulder(pain, 5, 8)
        photo_high = right_shoulder(photophobia, 5, 8)
        blur_high = right_shoulder(blurred, 5, 8)
        
        if isinstance(onset_type, str):
            onset_val = 1.0 if onset_type.strip().capitalize() == "Sudden" else 0.0
        else:
            onset_val = 1.0 if onset_type else 0.0
            
        score = pain_high * 0.30 + photo_high * 0.25 + blur_high * 0.25 + onset_val * 0.20
        return float(score)
