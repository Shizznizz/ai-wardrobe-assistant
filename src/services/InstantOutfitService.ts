import { WeatherInfo } from '@/lib/types';

export interface InstantOutfit {
  id: string;
  title: string;
  items: string[];
  reasoning: string;
  styleVibe: string;
  occasion: string;
}

export type StyleVibe = 'Minimalist' | 'Boho Chic' | 'Sporty' | 'Edgy' | 'Classic' | 'Romantic';
export type Occasion = 'Work' | 'Casual' | 'Date Night' | 'Weekend';
export type WeatherCondition = 'Sunny' | 'Rainy' | 'Cold' | 'Hot';

const outfitDatabase: Record<string, Record<string, Record<string, InstantOutfit[]>>> = {
  Minimalist: {
    Work: {
      Sunny: [
        {
          id: '1',
          title: 'Crisp Professional',
          items: ['White button-up shirt', 'Black tailored trousers', 'Nude pointed-toe flats', 'Simple gold watch'],
          reasoning: 'Clean lines and neutral tones create a polished, professional look perfect for warm office days.',
          styleVibe: 'Minimalist',
          occasion: 'Work'
        }
      ],
      Rainy: [
        {
          id: '2',
          title: 'Sleek & Weather-Ready',
          items: ['Grey turtleneck', 'Black ankle-length trousers', 'Chelsea boots', 'Structured black tote'],
          reasoning: 'Sophisticated layers keep you dry while maintaining a clean, minimal aesthetic.',
          styleVibe: 'Minimalist',
          occasion: 'Work'
        }
      ],
      Cold: [
        {
          id: '3',
          title: 'Warm Monochrome',
          items: ['Black cashmere sweater', 'Grey wool trousers', 'Black leather ankle boots', 'Camel coat'],
          reasoning: 'Luxe fabrics in neutral tones provide warmth without sacrificing minimalist elegance.',
          styleVibe: 'Minimalist',
          occasion: 'Work'
        }
      ],
      Hot: [
        {
          id: '4',
          title: 'Breezy Professional',
          items: ['Linen blend shirt in ivory', 'Wide-leg trousers in beige', 'Leather sandals', 'Straw tote bag'],
          reasoning: 'Breathable fabrics and relaxed silhouettes keep you cool while looking office-appropriate.',
          styleVibe: 'Minimalist',
          occasion: 'Work'
        }
      ]
    },
    Casual: {
      Sunny: [
        {
          id: '5',
          title: 'Effortless Weekend',
          items: ['White t-shirt', 'Light-wash jeans', 'White sneakers', 'Canvas tote bag'],
          reasoning: 'Timeless basics create an easy, put-together look for running errands or coffee dates.',
          styleVibe: 'Minimalist',
          occasion: 'Casual'
        }
      ],
      Rainy: [
        {
          id: '6',
          title: 'Cozy Comfort',
          items: ['Grey crewneck sweatshirt', 'Black joggers', 'White sneakers', 'Crossbody bag'],
          reasoning: 'Comfortable essentials that work in wet weather while keeping your minimalist vibe.',
          styleVibe: 'Minimalist',
          occasion: 'Casual'
        }
      ],
      Cold: [
        {
          id: '7',
          title: 'Layered Simplicity',
          items: ['Black turtleneck', 'High-waist jeans', 'White sneakers', 'Long grey coat'],
          reasoning: 'Strategic layering keeps you warm while maintaining clean, uncluttered lines.',
          styleVibe: 'Minimalist',
          occasion: 'Casual'
        }
      ],
      Hot: [
        {
          id: '8',
          title: 'Summer Ease',
          items: ['Linen tank top', 'Denim shorts', 'Slide sandals', 'Straw hat'],
          reasoning: 'Light, breathable pieces in neutral tones perfect for hot casual days.',
          styleVibe: 'Minimalist',
          occasion: 'Casual'
        }
      ]
    },
    'Date Night': {
      Sunny: [
        {
          id: '9',
          title: 'Understated Elegance',
          items: ['Black slip dress', 'Strappy heeled sandals', 'Gold hoop earrings', 'Structured clutch'],
          reasoning: 'Simple sophistication with subtle details creates a memorable evening look.',
          styleVibe: 'Minimalist',
          occasion: 'Date Night'
        }
      ],
      Rainy: [
        {
          id: '10',
          title: 'Chic Simplicity',
          items: ['Black midi dress', 'Leather ankle boots', 'Trench coat', 'Small leather bag'],
          reasoning: 'Weather-appropriate elegance that transitions beautifully from dinner to drinks.',
          styleVibe: 'Minimalist',
          occasion: 'Date Night'
        }
      ],
      Cold: [
        {
          id: '11',
          title: 'Refined Warmth',
          items: ['Turtleneck sweater dress in camel', 'Knee-high boots', 'Wool coat', 'Delicate necklace'],
          reasoning: 'Cozy yet elegant pieces that keep you warm without sacrificing style.',
          styleVibe: 'Minimalist',
          occasion: 'Date Night'
        }
      ],
      Hot: [
        {
          id: '12',
          title: 'Summer Night',
          items: ['Linen slip dress in off-white', 'Strappy flat sandals', 'Simple gold jewelry', 'Woven clutch'],
          reasoning: 'Cool, breathable fabrics with elegant draping perfect for warm evenings.',
          styleVibe: 'Minimalist',
          occasion: 'Date Night'
        }
      ]
    },
    Weekend: {
      Sunny: [
        {
          id: '13',
          title: 'Relaxed Refinement',
          items: ['Oversized white shirt', 'Linen shorts in beige', 'Leather sandals', 'Straw bag'],
          reasoning: 'Effortlessly chic pieces perfect for brunch or weekend exploring.',
          styleVibe: 'Minimalist',
          occasion: 'Weekend'
        }
      ],
      Rainy: [
        {
          id: '14',
          title: 'Weekend Layers',
          items: ['Grey sweater', 'Black leggings', 'Chelsea boots', 'Raincoat'],
          reasoning: 'Practical comfort with minimalist appeal for indoor weekend activities.',
          styleVibe: 'Minimalist',
          occasion: 'Weekend'
        }
      ],
      Cold: [
        {
          id: '15',
          title: 'Cozy Weekend',
          items: ['Cashmere sweater', 'Straight-leg jeans', 'Ankle boots', 'Long puffer coat'],
          reasoning: 'Warm essentials that keep you comfortable during cold weekend outings.',
          styleVibe: 'Minimalist',
          occasion: 'Weekend'
        }
      ],
      Hot: [
        {
          id: '16',
          title: 'Breezy Comfort',
          items: ['Linen button-up', 'Wide-leg shorts', 'Slides', 'Canvas tote'],
          reasoning: 'Cool, relaxed pieces for hot weekend days spent outdoors.',
          styleVibe: 'Minimalist',
          occasion: 'Weekend'
        }
      ]
    }
  },
  // Add more style vibes with similar structure...
  'Boho Chic': {
    Casual: {
      Sunny: [
        {
          id: '17',
          title: 'Festival Vibes',
          items: ['Flowy floral maxi dress', 'Leather sandals', 'Fringe crossbody bag', 'Layered necklaces'],
          reasoning: 'Free-spirited pieces with bohemian flair perfect for sunny days.',
          styleVibe: 'Boho Chic',
          occasion: 'Casual'
        }
      ],
      Rainy: [
        {
          id: '18',
          title: 'Boho Layers',
          items: ['Crochet top', 'Wide-leg jeans', 'Suede ankle boots', 'Fringed vest'],
          reasoning: 'Textured layers create bohemian charm while keeping you dry.',
          styleVibe: 'Boho Chic',
          occasion: 'Casual'
        }
      ],
      Cold: [
        {
          id: '19',
          title: 'Cozy Bohemian',
          items: ['Chunky knit sweater', 'Corduroy pants', 'Suede boots', 'Long cardigan'],
          reasoning: 'Warm, textured pieces with free-spirited appeal for cold days.',
          styleVibe: 'Boho Chic',
          occasion: 'Casual'
        }
      ],
      Hot: [
        {
          id: '20',
          title: 'Summer Wanderer',
          items: ['Crochet crop top', 'High-waist shorts', 'Gladiator sandals', 'Woven bag'],
          reasoning: 'Breezy bohemian pieces perfect for hot summer adventures.',
          styleVibe: 'Boho Chic',
          occasion: 'Casual'
        }
      ]
    }
  },
  Sporty: {
    Casual: {
      Sunny: [
        {
          id: '21',
          title: 'Athleisure Chic',
          items: ['Cropped hoodie', 'High-waist leggings', 'Running sneakers', 'Baseball cap'],
          reasoning: 'Active-ready pieces that transition from workout to errands effortlessly.',
          styleVibe: 'Sporty',
          occasion: 'Casual'
        }
      ]
    }
  },
  Edgy: {
    'Date Night': {
      Sunny: [
        {
          id: '22',
          title: 'Rock Chic',
          items: ['Leather jacket', 'Black skinny jeans', 'Combat boots', 'Band tee'],
          reasoning: 'Bold pieces with edge create a confident, memorable evening look.',
          styleVibe: 'Edgy',
          occasion: 'Date Night'
        }
      ]
    }
  },
  Classic: {
    Work: {
      Sunny: [
        {
          id: '23',
          title: 'Timeless Professional',
          items: ['Navy blazer', 'White blouse', 'Khaki trousers', 'Loafers'],
          reasoning: 'Traditional pieces that never go out of style, perfect for the office.',
          styleVibe: 'Classic',
          occasion: 'Work'
        }
      ]
    }
  },
  Romantic: {
    'Date Night': {
      Sunny: [
        {
          id: '24',
          title: 'Dreamy Evening',
          items: ['Lace blouse', 'Flowy midi skirt', 'Strappy heels', 'Pearl earrings'],
          reasoning: 'Feminine details create a soft, romantic look for special evenings.',
          styleVibe: 'Romantic',
          occasion: 'Date Night'
        }
      ]
    }
  }
};

function determineWeatherCondition(weather: WeatherInfo | null): WeatherCondition {
  if (!weather) return 'Sunny';

  const temp = weather.temperature;
  const condition = weather.condition.toLowerCase();

  if (condition.includes('rain') || condition.includes('drizzle')) return 'Rainy';
  if (temp < 10) return 'Cold';
  if (temp > 25) return 'Hot';
  return 'Sunny';
}

export function generateInstantOutfits(
  styleVibe: StyleVibe,
  occasion: Occasion,
  weather: WeatherInfo | null,
  manualWeather?: WeatherCondition
): InstantOutfit[] {
  const weatherCondition = manualWeather || determineWeatherCondition(weather);

  // Get outfits from database
  const outfits = outfitDatabase[styleVibe]?.[occasion]?.[weatherCondition] || [];

  // If we have outfits for this combination, return up to 3
  if (outfits.length > 0) {
    return outfits.slice(0, 3);
  }

  // Fallback: generate generic outfits
  return generateFallbackOutfits(styleVibe, occasion, weatherCondition);
}

function generateFallbackOutfits(
  styleVibe: StyleVibe,
  occasion: Occasion,
  weatherCondition: WeatherCondition
): InstantOutfit[] {
  return [
    {
      id: `fallback-1-${Date.now()}`,
      title: `${styleVibe} ${occasion} Look`,
      items: [
        'Comfortable top',
        'Well-fitted bottoms',
        'Appropriate footwear',
        'Matching accessories'
      ],
      reasoning: `A versatile ${styleVibe.toLowerCase()} outfit perfect for ${occasion.toLowerCase()} in ${weatherCondition.toLowerCase()} weather.`,
      styleVibe,
      occasion
    },
    {
      id: `fallback-2-${Date.now()}`,
      title: `Alternative ${styleVibe} Style`,
      items: [
        'Statement piece',
        'Classic basics',
        'Comfortable shoes',
        'Simple accessories'
      ],
      reasoning: `Another ${styleVibe.toLowerCase()} option that works beautifully for ${occasion.toLowerCase()} occasions.`,
      styleVibe,
      occasion
    },
    {
      id: `fallback-3-${Date.now()}`,
      title: `${occasion} Essential`,
      items: [
        'Layering piece',
        'Versatile bottoms',
        'Stylish footwear',
        'Coordinating bag'
      ],
      reasoning: `A reliable ${occasion.toLowerCase()} outfit that embodies your ${styleVibe.toLowerCase()} aesthetic.`,
      styleVibe,
      occasion
    }
  ];
}
