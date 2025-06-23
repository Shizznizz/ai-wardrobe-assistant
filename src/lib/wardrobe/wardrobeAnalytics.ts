
import { ClothingItem } from '@/lib/types';

export interface WardrobeCategory {
  name: string;
  requiredItems: string[];
  coverage: number;
  items: ClothingItem[];
  missing: string[];
  recommendations: string[];
}

export interface WardrobeGapAnalysis {
  categories: WardrobeCategory[];
  overallScore: number;
  primaryGap: WardrobeCategory | null;
  insights: string[];
}

const WARDROBE_CATEGORIES = {
  casual: {
    name: 'Casual',
    requiredItems: ['t-shirt', 'jeans', 'sneakers', 'casual shirt', 'hoodie'],
    recommendations: ['comfortable basics', 'versatile denim', 'casual footwear']
  },
  formal: {
    name: 'Formal',
    requiredItems: ['dress shirt', 'blazer', 'dress pants', 'dress shoes', 'tie'],
    recommendations: ['tailored blazer', 'dress shirt', 'formal footwear', 'accessories']
  },
  sporty: {
    name: 'Sporty',
    requiredItems: ['athletic wear', 'sports shoes', 'activewear', 'gym clothes', 'workout top'],
    recommendations: ['performance wear', 'athletic footwear', 'moisture-wicking fabrics']
  },
  boho: {
    name: 'Boho',
    requiredItems: ['flowy dress', 'maxi skirt', 'kimono', 'sandals', 'jewelry'],
    recommendations: ['flowing silhouettes', 'earthy tones', 'layering pieces']
  },
  professional: {
    name: 'Professional',
    requiredItems: ['suit', 'blouse', 'pencil skirt', 'professional shoes', 'cardigan'],
    recommendations: ['structured pieces', 'neutral colors', 'polished accessories']
  },
  seasonal: {
    name: 'Seasonal',
    requiredItems: ['coat', 'jacket', 'boots', 'sweater', 'scarf'],
    recommendations: ['layering pieces', 'weather-appropriate outerwear', 'seasonal accessories']
  }
};

export const analyzeWardrobeGaps = (items: ClothingItem[]): WardrobeGapAnalysis => {
  const categories: WardrobeCategory[] = Object.entries(WARDROBE_CATEGORIES).map(([key, config]) => {
    // More sophisticated matching logic
    const categoryItems = items.filter(item => {
      const itemName = (item.name || '').toLowerCase();
      const itemType = (item.type || '').toLowerCase();
      const itemOccasions = item.occasions || [];
      
      // Check if item matches this category
      const nameMatch = config.requiredItems.some(required => 
        itemName.includes(required.toLowerCase()) || 
        itemType.includes(required.toLowerCase())
      );
      
      const occasionMatch = itemOccasions.some(occasion => 
        occasion.toLowerCase().includes(key.toLowerCase()) ||
        (key === 'formal' && (occasion.toLowerCase().includes('business') || occasion.toLowerCase().includes('professional'))) ||
        (key === 'casual' && occasion.toLowerCase().includes('casual')) ||
        (key === 'sporty' && (occasion.toLowerCase().includes('sport') || occasion.toLowerCase().includes('gym')))
      );
      
      return nameMatch || occasionMatch;
    });

    // Calculate coverage based on actual items vs required items
    const uniqueTypesFound = new Set();
    categoryItems.forEach(item => {
      config.requiredItems.forEach(required => {
        if ((item.name || '').toLowerCase().includes(required.toLowerCase()) || 
            (item.type || '').toLowerCase().includes(required.toLowerCase())) {
          uniqueTypesFound.add(required);
        }
      });
    });

    const coverage = Math.min(100, (uniqueTypesFound.size / config.requiredItems.length) * 100);
    
    const missing = config.requiredItems.filter(required => 
      !Array.from(uniqueTypesFound).includes(required)
    );

    return {
      name: config.name,
      requiredItems: config.requiredItems,
      coverage,
      items: categoryItems,
      missing,
      recommendations: config.recommendations
    };
  });

  const overallScore = categories.reduce((sum, cat) => sum + cat.coverage, 0) / categories.length;
  const primaryGap = categories
    .filter(cat => cat.coverage < 80) // Only consider categories that need improvement
    .reduce((lowest, current) => 
      current.coverage < (lowest?.coverage || 100) ? current : lowest, null
    );

  const insights = generateInsights(categories, overallScore, items.length);

  return {
    categories,
    overallScore,
    primaryGap,
    insights
  };
};

const generateInsights = (categories: WardrobeCategory[], overallScore: number, totalItems: number): string[] => {
  const insights: string[] = [];
  
  const strongCategories = categories.filter(cat => cat.coverage >= 80);
  const weakCategories = categories.filter(cat => cat.coverage < 50);
  
  if (totalItems === 0) {
    insights.push("Start building your wardrobe by adding items to different categories.");
    return insights;
  }
  
  if (strongCategories.length > 0) {
    insights.push(`You're well-covered for ${strongCategories.map(cat => cat.name.toLowerCase()).join(', ')} styles.`);
  }
  
  if (weakCategories.length > 0) {
    const primaryWeak = weakCategories[0];
    const suggestions = primaryWeak.missing.slice(0, 2);
    if (suggestions.length > 0) {
      insights.push(`${primaryWeak.name} attire needs attention. Consider adding ${suggestions.join(' and ')}.`);
    }
  }
  
  if (overallScore >= 80) {
    insights.push("Your wardrobe is well-rounded with excellent category coverage!");
  } else if (overallScore >= 60) {
    insights.push("You have a solid foundation - just a few key pieces needed.");
  } else if (overallScore >= 30) {
    insights.push("Good start! Adding strategic pieces will significantly boost your styling options.");
  } else {
    insights.push("Let's build a complete wardrobe together - focus on versatile basics first.");
  }
  
  return insights;
};

export const getMockRecommendations = (category: string) => {
  const recommendations = {
    casual: [
      { name: 'Classic White T-Shirt', description: 'Versatile cotton tee perfect for layering', image: '/lovable-uploads/f29b0fb8-330c-409a-8488-2e7ae2b351ed.png' },
      { name: 'Dark Wash Jeans', description: 'Comfortable straight-leg denim', image: '/lovable-uploads/e29a1d16-e806-4664-a744-c1f7b25262ed.png' },
      { name: 'White Sneakers', description: 'Clean minimal sneakers for everyday wear', image: '/lovable-uploads/d39047b3-c0ad-4b2c-9d73-c654479f56c4.png' }
    ],
    formal: [
      { name: 'Black Blazer', description: 'Tailored blazer for professional occasions', image: '/lovable-uploads/56943e49-b4d1-47fe-adf7-ee221134ef60.png' },
      { name: 'Dress Shirt', description: 'Crisp white button-down shirt', image: '/lovable-uploads/5c9492c5-2df1-4f02-8d61-70fd1e57a6af.png' },
      { name: 'Leather Loafers', description: 'Classic leather shoes for business attire', image: '/lovable-uploads/c26c0c8c-7ff3-432a-b79b-1d22494daba6.png' }
    ],
    sporty: [
      { name: 'Athletic Leggings', description: 'High-performance workout leggings', image: '/lovable-uploads/ba771b95-f70c-4fb3-b306-66b21e14dba7.png' },
      { name: 'Sports Bra', description: 'Supportive activewear top', image: '/lovable-uploads/bfaef886-abbd-4207-a2de-99cfeb0aee94.png' },
      { name: 'Running Shoes', description: 'Comfortable athletic footwear', image: '/lovable-uploads/0d17107f-9669-4861-9060-6dbd31ca6db2.png' }
    ],
    professional: [
      { name: 'Navy Suit', description: 'Professional two-piece suit', image: '/lovable-uploads/56943e49-b4d1-47fe-adf7-ee221134ef60.png' },
      { name: 'Silk Blouse', description: 'Elegant silk blouse for work', image: '/lovable-uploads/5c9492c5-2df1-4f02-8d61-70fd1e57a6af.png' },
      { name: 'Pointed Heels', description: 'Classic professional heels', image: '/lovable-uploads/c26c0c8c-7ff3-432a-b79b-1d22494daba6.png' }
    ],
    boho: [
      { name: 'Flowy Maxi Dress', description: 'Bohemian-style flowing dress', image: '/lovable-uploads/f29b0fb8-330c-409a-8488-2e7ae2b351ed.png' },
      { name: 'Kimono Cardigan', description: 'Lightweight layering piece', image: '/lovable-uploads/e29a1d16-e806-4664-a744-c1f7b25262ed.png' },
      { name: 'Strappy Sandals', description: 'Bohemian-inspired footwear', image: '/lovable-uploads/d39047b3-c0ad-4b2c-9d73-c654479f56c4.png' }
    ],
    seasonal: [
      { name: 'Winter Coat', description: 'Warm winter outerwear', image: '/lovable-uploads/56943e49-b4d1-47fe-adf7-ee221134ef60.png' },
      { name: 'Wool Sweater', description: 'Cozy knit for cold weather', image: '/lovable-uploads/5c9492c5-2df1-4f02-8d61-70fd1e57a6af.png' },
      { name: 'Ankle Boots', description: 'Versatile seasonal footwear', image: '/lovable-uploads/c26c0c8c-7ff3-432a-b79b-1d22494daba6.png' }
    ]
  };
  
  return recommendations[category as keyof typeof recommendations] || recommendations.casual;
};
