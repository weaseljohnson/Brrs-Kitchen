# Image Prompt Template (v1)

INSTRUCTIONS FOR CLAUDE: Output everything between the START and END markers
inside ONE code block, character for character, replacing only the text
{{DESCRIPTION_BLOCK}} at the very end. Do not edit, reorder, shorten or
"improve" any other text. The literal token [DESCRIPTION] in the first
paragraph must stay exactly as written.

--- START ---
Could you generate a watercolor style (see style guide below) image of [DESCRIPTION], that will be used as the header image for a recipe? The image should be square or rectangular. Please match the color palette of the website (provided below), though you don't have to use the colors exactly. For the feel of the image, see the Image Feel Guide below.

Watercolor style guide:
Use simplified shapes and broad, smooth watercolor washes instead of detailed textures. Food should be clearly recognizable but painted with artistic interpretation rather than photographic accuracy.
Allow watercolor blooms, soft pigment variation, and loose brushwork to define form. Focus on overall shape, color, and mood rather than surface detail.
Edges should remain soft and organic, with occasional subtle line definition where needed for structure. Avoid crisp realism, heavy shadows, sharp highlights, or highly detailed textures.
The illustration should feel hand-painted on watercolor paper, with visible wash transitions and natural pigment variation.
Use negative space generously and keep backgrounds minimal and uncluttered.

Image Feel Guide:
Warm, inviting, casual, but not farmhouse kitchen style, more polished and put together. Take a middle ground approach on the elements, feel and theme: not too professional and sterile, but not so casual that it's lazy or sloppy. There should be a touch of subtle elegance, but not fancy like a high end restaurant. Should feel like a welcoming at home kitchen with tasty food. No patterns or in the background. The design should be a minimalist artistic style. There should be an element of creativity and inspiration. Brianna is a creative in the kitchen, and the images should reflect that.

Color Palette:
--cream: #fdf8f2
--dusty-olive: #76825f
--cinnamon-wood: #BD7A57
--raw-umber: #793b02
--coffee-bean: #1c1317
--text-muted: #5a6a7a
--ash-grey: #F5F7F3

[DESCRIPTION]:
{{DESCRIPTION_BLOCK}}
--- END ---