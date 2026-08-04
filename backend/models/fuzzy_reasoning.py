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

    def visual_impairment_index(self, blurred, floaters, glare, peripheral_vision_loss):
        blur_high = right_shoulder(blurred, 5, 8)
        # Apply hedges to uncertain patient visual symptoms
        floaters_hedged = hedge(floaters, "very")
        glare_hedged = hedge(glare, "somewhat")
        peripheral_hedged = hedge(peripheral_vision_loss, "very")
        
        score = blur_high * 0.40 + floaters_hedged * 0.25 + glare_hedged * 0.20 + peripheral_hedged * 0.15
        return float(score)

    def autoimmune_index(self, rheumatoid, psoriasis, ibd, ankylosing, sarcoidosis):
        score = (rheumatoid + psoriasis + ibd + ankylosing + sarcoidosis) / 5.0
        return float(score)

    def infection_index(self, tuberculosis, syphilis, hiv, recent_infection):
        score = (tuberculosis + syphilis + hiv + recent_infection) / 4.0
        return float(score)

    def recurrence_index(self, similar_episode_before, previous_uveitis, family_uveitis):
        previous_episodes = float(similar_episode_before)
        family_hedged = hedge(family_uveitis, "more_or_less")
        score = previous_uveitis * 0.5 + family_hedged * 0.3 + previous_episodes * 0.2
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
