---
SECTION_ID: files.assets.image.satin-rooftop-ref_png
TYPE: file/image
---

# Satin Rooftop — Seedance Anchor Frame

FILE: assets/image/satin-rooftop-ref.png

UTILITY: gpt_image
WIDTH: 1920
HEIGHT: 1088
QUALITY: high
OUTPUT_FORMAT: png

PROMPT: |
  Goal: a single photorealistic fashion-editorial still that will be used as the opening
  anchor frame of a 13-second motion clip. It must read as one frame lifted out of a real
  rooftop shoot, not as a poster.

  Scene: open concrete rooftop at blue hour, high above a dense city. Behind the subject a
  skyline of lit office towers recedes into haze, thousands of small warm window lights,
  a few red aircraft beacons. Wet patches on the concrete throw broken reflections. Low
  parapet wall at the right edge. Sky is deep indigo with a thin band of residual orange
  on the horizon.

  Subject: one adult woman in elegant formal eveningwear, standing three-quarters to camera,
  weight on her back foot, mid-turn as if she has just stopped walking. Floor-length
  bias-cut satin evening gown the colour of red wine — deep burgundy, cool highlights,
  visible liquid sheen where the fabric catches the skyline. Modest high neckline, long
  sleeves, fully covered silhouette, hem brushing the concrete and lifting slightly at the
  front so the shoes read clearly. Clear crystal-embellished high-heeled sandals with
  faceted stones across the strap and heel, throwing tiny hard sparkles. Dark hair pulled
  back off the face. Tasteful red-carpet styling. No handbag, no jewellery beyond small studs.

  Key details: fine fabric grain in the satin, believable folds and drape, the weight of a
  heavy silk-satin gown, contact shadows under the heels on the concrete, natural
  photographic skin rendering with no airbrushing or plastic retouching.

  Composition: full-length figure, eye-level to slightly low, 35mm lens look, subject placed
  left of centre with the skyline filling the right two thirds. Shallow-ish depth of field —
  the dress and heels sharp, the towers softly out of focus. Practical rim light from the
  city behind her, a single soft key from camera left, cool shadows.

  Grade: rich contrast, crushed blacks, warm skin against cool blue ambience, slight
  halation on the brightest window lights, fine film grain.

  Constraints: no text, no captions, no watermarks, no logos, no brand marks, no visible
  signage on the towers. No crowd, no other people. Nothing pasted-on — lighting on the
  subject must match the skyline direction.

DESCRIPTION: Blue-hour rooftop fashion still — wine satin slip dress, crystal heels, city skyline behind. Anchor frame for the Seedance motion pass.
USAGE: IMAGE-INPUT for assets/video/satin-rooftop-crystal-heels.mp4.

COMMENTS: ## Image Notes
- Generated with gpt_image (GPT-Image 2.0) because the published caption credits
  "ChatGPT Images 2.0 for the reference" — the copy has to be literally true.
- 1920x1080 so the frame drops straight into a 16:9 Seedance run with no crop; a square or
  portrait anchor forces the model to invent the missing sides.
- The wardrobe description here is the single source of truth: the same words get copied
  verbatim into the video prompt. Wardrobe drift across cuts is the failure mode that
  killed continuity on the earlier fisheye films.
- Text is banned outright. Prior generations in this project rendered melting pseudo-letters
  on signage; a skyline full of office windows is exactly where the model wants to invent
  logos.
