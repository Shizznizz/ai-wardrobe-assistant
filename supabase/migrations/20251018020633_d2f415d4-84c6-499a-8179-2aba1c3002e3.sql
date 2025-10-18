-- Initial seed: 50+ diverse fashion trends for 2025-2026
INSERT INTO public.fashion_trends (trend_name, season, description, colors, key_pieces, style_tags, popularity_score) VALUES

-- SPRING 2025 TRENDS (15 trends)
('Sheer Layering', 'spring_2025', 'Transparent and semi-sheer fabrics layered over undergarments or solid pieces. Creates ethereal, romantic looks with a modern edge. Perfect for transitional spring weather.', ARRAY['nude', 'white', 'black', 'lavender'], ARRAY['sheer blouse', 'mesh top', 'organza dress', 'transparent blazer'], ARRAY['romantic', 'ethereal', 'modern'], 89),

('Maxi Skirt Renaissance', 'spring_2025', 'Floor-length skirts are back in bold prints, flowing fabrics, and statement silhouettes. Pair with cropped tops or tucked shirts for balanced proportions.', ARRAY['floral prints', 'navy', 'emerald', 'rust'], ARRAY['pleated maxi', 'wrap skirt', 'tiered skirt'], ARRAY['bohemian', 'elegant', 'feminine'], 92),

('Butter Yellow Everything', 'spring_2025', 'Soft, warm butter yellow dominates spring palettes. This optimistic shade appears in everything from tailoring to accessories, bringing sunshine to any outfit.', ARRAY['butter yellow', 'cream', 'gold'], ARRAY['yellow blazer', 'midi dress', 'handbag'], ARRAY['cheerful', 'optimistic', 'sophisticated'], 87),

('Cargo Renaissance', 'spring_2025', 'Utilitarian cargo pants and skirts with multiple pockets. Updated with softer fabrics and feminine silhouettes. Both practical and fashion-forward.', ARRAY['olive', 'beige', 'black', 'khaki'], ARRAY['cargo pants', 'cargo skirt', 'utility vest'], ARRAY['utilitarian', 'practical', 'streetwear'], 85),

('Pearl Mania', 'spring_2025', 'Pearls everywhere - not just jewelry. Embellished garments, pearl buttons, pearl-adorned accessories. Modern take on classic elegance.', ARRAY['white', 'cream', 'pink'], ARRAY['pearl cardigan', 'pearl bag', 'pearl headband'], ARRAY['elegant', 'preppy', 'luxe'], 90),

('Cut-Out Details', 'spring_2025', 'Strategic cut-outs on dresses, tops, and swimwear. Reveals just enough skin while maintaining sophistication. Key placement at waist, shoulders, or back.', ARRAY['black', 'white', 'red', 'nude'], ARRAY['cut-out dress', 'shoulder detail top'], ARRAY['sexy', 'modern', 'bold'], 86),

('Oversized Blazers', 'spring_2025', 'Dramatically oversized, borrowed-from-the-boys blazers. Shoulder pads are back. Pair with slim bottoms for proportion play.', ARRAY['pinstripe', 'grey', 'navy', 'camel'], ARRAY['oversized blazer', 'boyfriend blazer'], ARRAY['power dressing', 'androgynous', 'professional'], 93),

('Crochet Everything', 'spring_2025', 'Handcrafted crochet pieces from tops to bags. Bohemian meets luxury. Supports artisanal craftsmanship and sustainable fashion.', ARRAY['ecru', 'rainbow', 'earth tones'], ARRAY['crochet top', 'crochet bag', 'crochet dress'], ARRAY['bohemian', 'artisanal', 'sustainable'], 84),

('Balletcore', 'spring_2025', 'Ballet-inspired fashion with wrap cardigans, leg warmers, tulle skirts, and dance-ready silhouettes. Soft, graceful, and ultra-feminine.', ARRAY['pink', 'lavender', 'white', 'grey'], ARRAY['wrap cardigan', 'ballet flats', 'tulle skirt'], ARRAY['romantic', 'feminine', 'graceful'], 88),

('Micro Bags', 'spring_2025', 'Impossibly tiny handbags that barely fit essentials. A statement accessory rather than functional piece. The smaller, the more fashion-forward.', ARRAY['bold colors', 'metallics', 'neon'], ARRAY['micro bag', 'mini purse'], ARRAY['playful', 'statement', 'minimalist'], 82),

('Preppy Pleats', 'spring_2025', 'Pleated skirts and pants in tennis-inspired whites and navy. Academic chic meets country club. Clean, polished, and timeless.', ARRAY['white', 'navy', 'burgundy', 'forest green'], ARRAY['pleated skirt', 'pleated trousers', 'polo shirt'], ARRAY['preppy', 'academic', 'classic'], 87),

('Garden Party Florals', 'spring_2025', 'Oversized, romantic floral prints on flowing dresses and separates. Think English garden tea party meets modern romance.', ARRAY['pink', 'green', 'cream', 'lavender'], ARRAY['floral dress', 'floral blouse'], ARRAY['romantic', 'feminine', 'whimsical'], 91),

('Sporty Luxe', 'spring_2025', 'Athletic wear elevated with luxury fabrics and tailored cuts. Track pants in silk, hoodies in cashmere. Comfort meets sophistication.', ARRAY['navy', 'grey', 'black', 'white'], ARRAY['silk joggers', 'cashmere hoodie', 'luxury sneakers'], ARRAY['athletic', 'luxurious', 'comfortable'], 85),

('Bow Accents', 'spring_2025', 'Feminine bow details on everything - necklines, waists, shoes, bags. Adds playful romance to any piece. Larger bows make bigger statements.', ARRAY['black', 'white', 'pink', 'red'], ARRAY['bow blouse', 'bow headband', 'bow flats'], ARRAY['feminine', 'romantic', 'playful'], 86),

('Mesh and Net', 'spring_2025', 'Sporty mesh fabrics beyond activewear. Mesh overlays, net details, and see-through panels add texture and edge to everyday pieces.', ARRAY['black', 'white', 'neon'], ARRAY['mesh dress', 'net top'], ARRAY['sporty', 'edgy', 'modern'], 83),

-- SUMMER 2025 TRENDS (12 trends)
('Tropical Maximalism', 'summer_2025', 'Bold, oversized tropical prints in saturated colors. More is more - big palms, exotic flowers, vibrant birds. Vacation vibes meet high fashion.', ARRAY['hot pink', 'turquoise', 'orange', 'lime green'], ARRAY['tropical print dress', 'palm shirt', 'jungle print shorts'], ARRAY['bold', 'maximalist', 'vacation'], 90),

('White-on-White', 'summer_2025', 'Monochromatic white looks from head to toe. Mix textures - linen, cotton, lace, silk. Ultra-chic and eternally elegant for summer.', ARRAY['white', 'cream', 'ivory'], ARRAY['white linen pants', 'white dress', 'white blazer'], ARRAY['elegant', 'sophisticated', 'clean'], 92),

('Cutout Swimwear', 'summer_2025', 'Swimsuits with strategic cutouts and unique strap configurations. Sculptural designs that double as bodywear for daytime styling.', ARRAY['black', 'neon', 'metallics'], ARRAY['cutout one-piece', 'strappy bikini'], ARRAY['sexy', 'sculptural', 'athletic'], 88),

('Vacation Shirting', 'summer_2025', 'Relaxed, oversized button-up shirts in playful prints. Cuban collars, short sleeves, and breezy fabrics. Resort wear goes urban.', ARRAY['pastel', 'tropical prints', 'stripes'], ARRAY['Hawaiian shirt', 'bowling shirt', 'camp collar shirt'], ARRAY['relaxed', 'vacation', 'casual'], 87),

('Denim Everything', 'summer_2025', 'Total denim looks - matching sets, patchwork pieces, and unconventional denim items. From ultra-light summer denim to structured pieces.', ARRAY['light wash', 'medium wash', 'white denim'], ARRAY['denim dress', 'jean jacket', 'denim skirt'], ARRAY['casual', 'American', 'versatile'], 91),

('Nautical Stripes', 'summer_2025', 'Classic Breton stripes get a modern update. Beyond navy and white - try red, green, or multicolor stripes. Timeless summer staple.', ARRAY['navy white', 'red white', 'multicolor'], ARRAY['striped shirt', 'striped dress'], ARRAY['classic', 'preppy', 'maritime'], 86),

('Raffia Accessories', 'summer_2025', 'Natural raffia bags, hats, and jewelry. Sustainable and stylish. Adds organic texture to summer looks.', ARRAY['natural', 'tan', 'straw'], ARRAY['raffia bag', 'straw hat', 'woven accessories'], ARRAY['natural', 'sustainable', 'bohemian'], 85),

('Neon Brights', 'summer_2025', 'Electric neon colors that demand attention. Use as statement pieces or go full neon. High-visibility fashion at its finest.', ARRAY['neon pink', 'electric blue', 'lime', 'orange'], ARRAY['neon dress', 'neon accessories'], ARRAY['bold', 'electric', 'statement'], 84),

('Bra Tops', 'summer_2025', 'Bralettes and bandeau tops worn as outerwear. Layer under blazers or wear solo. Confident, body-positive summer styling.', ARRAY['white', 'black', 'pastels'], ARRAY['bandeau top', 'bralette'], ARRAY['confident', 'minimal', 'summer'], 83),

('Terrycloth Revival', 'summer_2025', 'Beach towel fabric becomes fashion. Terrycloth dresses, shorts, and accessories. Playful, absorbent, and very summer.', ARRAY['pastel', 'white', 'rainbow'], ARRAY['terrycloth dress', 'terry shorts', 'terry bucket hat'], ARRAY['playful', 'retro', 'beach'], 82),

('Sunset Colors', 'summer_2025', 'Warm gradient hues inspired by sunset - coral, peach, terracotta, burnt orange. Creates harmonious, warm-weather looks.', ARRAY['coral', 'peach', 'terracotta', 'burnt orange'], ARRAY['sunset dress', 'coral blazer'], ARRAY['warm', 'romantic', 'bohemian'], 89),

('Linen Luxe', 'summer_2025', 'Premium linen in elevated cuts and rich colors. Wrinkles are chic. Breathable luxury for hot summer days.', ARRAY['natural', 'sage', 'terracotta', 'white'], ARRAY['linen suit', 'linen dress', 'linen pants'], ARRAY['luxurious', 'natural', 'breathable'], 90),

-- FALL 2025 TRENDS (12 trends)
('Burgundy Everywhere', 'fall_2025', 'Deep wine and burgundy tones dominate fall palettes. Rich, sophisticated, and flattering for all skin tones. The new neutral.', ARRAY['burgundy', 'wine', 'maroon', 'oxblood'], ARRAY['burgundy coat', 'wine dress', 'maroon sweater'], ARRAY['rich', 'sophisticated', 'autumnal'], 94),

('Oversized Scarves', 'fall_2025', 'Blanket-sized scarves that double as wraps or even makeshift capes. Cozy, practical, and extremely stylish.', ARRAY['plaid', 'neutral', 'earth tones'], ARRAY['oversized scarf', 'blanket scarf'], ARRAY['cozy', 'practical', 'layered'], 88),

('Leather Everything', 'fall_2025', 'Beyond jackets - leather dresses, skirts, pants, even shirts. Mix with soft fabrics for contrast. Edgy and sophisticated.', ARRAY['black', 'brown', 'burgundy', 'tan'], ARRAY['leather dress', 'leather pants', 'leather blazer'], ARRAY['edgy', 'rock', 'luxurious'], 91),

('Chunky Knits', 'fall_2025', 'Ultra-thick, cozy knitwear in oversized silhouettes. Cable knits, chunky weaves, and textured stitches. Comfort is key.', ARRAY['cream', 'camel', 'grey', 'forest green'], ARRAY['chunky sweater', 'cable knit cardigan'], ARRAY['cozy', 'textured', 'comfortable'], 90),

('Plaid Remix', 'fall_2025', 'Traditional plaid patterns in unexpected colors and placements. Modernized and fresh take on classic tartan.', ARRAY['multicolor plaid', 'neon plaid', 'pastel plaid'], ARRAY['plaid blazer', 'plaid skirt', 'plaid pants'], ARRAY['preppy', 'modern', 'pattern'], 87),

('Chocolate Brown', 'fall_2025', 'Rich chocolate brown as the ultimate fall neutral. Looks expensive, pairs with everything, and feels like autumn.', ARRAY['chocolate', 'cognac', 'espresso'], ARRAY['brown coat', 'chocolate dress', 'brown leather'], ARRAY['rich', 'earthy', 'luxurious'], 93),

('Knee-High Boots', 'fall_2025', 'Statement knee-high boots in various styles - sleek, chunky, heeled, flat. The ultimate fall footwear investment.', ARRAY['black', 'brown', 'burgundy'], ARRAY['knee-high boots', 'tall boots'], ARRAY['statement', 'elegant', 'versatile'], 92),

('Vest Layers', 'fall_2025', 'Sweater vests, quilted vests, leather vests. Adds dimension and warmth without bulk. Perfect for transitional weather.', ARRAY['neutral', 'earth tones', 'black'], ARRAY['sweater vest', 'quilted vest', 'leather vest'], ARRAY['layered', 'preppy', 'practical'], 86),

('Mocha Monochrome', 'fall_2025', 'Head-to-toe brown and beige tones. Mix textures and shades for depth. Sophisticated and effortlessly chic.', ARRAY['mocha', 'caramel', 'tan', 'beige'], ARRAY['brown suit', 'camel coat', 'tan knit'], ARRAY['monochrome', 'sophisticated', 'tonal'], 89),

('Fringe Details', 'fall_2025', 'Fringe embellishments on bags, jackets, boots, and accessories. Adds movement and western-inspired flair.', ARRAY['tan', 'black', 'brown'], ARRAY['fringe bag', 'fringe jacket', 'fringe boots'], ARRAY['western', 'bohemian', 'statement'], 84),

('Teddy Textures', 'fall_2025', 'Plush teddy bear fabrics in coats, jackets, and accessories. Cozy, tactile, and ultra-soft. Comfort meets style.', ARRAY['cream', 'brown', 'camel'], ARRAY['teddy coat', 'sherpa jacket'], ARRAY['cozy', 'textured', 'soft'], 88),

('Tartan Tradition', 'fall_2025', 'Classic tartan patterns in traditional colorways. Heritage meets modern styling. Timeless fall staple.', ARRAY['red tartan', 'green tartan', 'navy tartan'], ARRAY['tartan skirt', 'tartan blazer', 'tartan scarf'], ARRAY['classic', 'heritage', 'preppy'], 85),

-- WINTER 2025/2026 TRENDS (11 trends)
('Puffer Everything', 'winter_2025', 'Beyond coats - puffer bags, puffer boots, puffer accessories. Quilted warmth meets high fashion. Functional and fashionable.', ARRAY['black', 'silver', 'bright colors'], ARRAY['puffer coat', 'puffer bag', 'puffer vest'], ARRAY['functional', 'sporty', 'warm'], 91),

('Faux Fur Luxury', 'winter_2025', 'Luxurious faux fur in coats, collars, and accessories. Ethical, warm, and glamorous. Statement outerwear for winter.', ARRAY['white', 'camel', 'black', 'grey'], ARRAY['faux fur coat', 'fur collar', 'fur hat'], ARRAY['glamorous', 'ethical', 'luxurious'], 90),

('Metallics', 'winter_2025', 'Silver, gold, and bronze metallics add sparkle to winter wardrobes. From party pieces to everyday accessories. Shine bright.', ARRAY['silver', 'gold', 'bronze', 'copper'], ARRAY['metallic dress', 'metallic boots', 'metallic bag'], ARRAY['festive', 'bold', 'glamorous'], 87),

('Oversized Coats', 'winter_2025', 'Dramatically oversized outerwear - coats, parkas, and puffers. Cocoon silhouettes that envelop you in warmth.', ARRAY['camel', 'black', 'grey', 'navy'], ARRAY['oversized coat', 'cocoon coat'], ARRAY['dramatic', 'warm', 'oversized'], 92),

('Knit Sets', 'winter_2025', 'Matching knit coordinates - sweater and pants, cardigan and skirt. Cozy matching sets for effortless styling.', ARRAY['cream', 'grey', 'camel', 'black'], ARRAY['knit set', 'sweater pants', 'cardigan skirt'], ARRAY['cozy', 'coordinated', 'comfortable'], 88),

('Winter White', 'winter_2025', 'All-white winter looks that defy the old rules. Crisp, fresh, and unexpected for cold weather. Makes a bold statement.', ARRAY['white', 'cream', 'ivory'], ARRAY['white coat', 'white boots', 'winter white'], ARRAY['bold', 'unexpected', 'elegant'], 86),

('Statement Collars', 'winter_2025', 'Oversized, sculptural collars on coats, dresses, and shirts. Adds drama and frames the face beautifully.', ARRAY['black', 'white', 'jewel tones'], ARRAY['collar coat', 'peter pan collar', 'statement collar dress'], ARRAY['dramatic', 'elegant', 'architectural'], 84),

('Velvet Touch', 'winter_2025', 'Plush velvet in rich jewel tones. Perfect for holiday season and beyond. Luxurious texture for winter.', ARRAY['emerald', 'sapphire', 'ruby', 'black'], ARRAY['velvet dress', 'velvet blazer', 'velvet pants'], ARRAY['luxurious', 'festive', 'rich'], 89),

('Layered Jewelry', 'winter_2025', 'Multiple necklaces, stacked bracelets, and layered rings. More is more for winter accessories. Adds interest to covered-up looks.', ARRAY['gold', 'silver', 'mixed metals'], ARRAY['layered necklaces', 'stacked rings'], ARRAY['maximalist', 'statement', 'layered'], 85),

('Alpine Chic', 'winter_2025', 'Ski-inspired fashion for everyday wear. Fair isle patterns, ski boots, and cozy alpine vibes. Mountain glamour.', ARRAY['red', 'navy', 'cream', 'forest green'], ARRAY['fair isle sweater', 'snow boots', 'puffer vest'], ARRAY['sporty', 'cozy', 'alpine'], 87),

('Black Everything', 'winter_2025', 'Total black looks with texture and fabric play. Sophisticated, slimming, and eternally chic. New York winter uniform.', ARRAY['black'], ARRAY['black coat', 'black dress', 'black boots'], ARRAY['sophisticated', 'minimalist', 'urban'], 93);

-- Schedule weekly trend sync every Sunday at 2 AM
SELECT cron.schedule(
  'weekly-fashion-trends-sync',
  '0 2 * * 0',
  $$
  SELECT net.http_post(
    url:='https://aaiyxtbovepseasghtth.supabase.co/functions/v1/sync-fashion-trends',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaXl4dGJvdmVwc2Vhc2dodHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NzcxNDMsImV4cCI6MjA1ODA1MzE0M30.Pq66ZdBT_ZEBnPbXkDe-SVMnMvqoNjcuTo05GcPabL0"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);