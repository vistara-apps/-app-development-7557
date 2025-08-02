// Mock Livepeer service - using sample data for demo
// In production, you would integrate with actual Livepeer API

// Sample combat sports videos from Livepeer
const COMBAT_VIDEOS = [
  {
    id: '1',
    title: 'UFC 300: Jones vs Miocic - Full Fight Highlights',
    description: 'Epic heavyweight championship bout featuring two legends of the sport in an unforgettable main event.',
    type: 'highlight',
    category: 'mma',
    duration: '15:32',
    previewThumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=450&fit=crop',
    contentFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    isPremium: false,
    views: 1250000,
    rating: 4.8,
    uploadDate: '2024-07-25',
    fighters: ['Jon Jones', 'Stipe Miocic'],
    event: 'UFC 300',
    organization: 'UFC',
    weightClass: 'Heavyweight',
    tags: ['championship', 'knockout', 'highlights']
  },
  {
    id: '2',
    title: 'Canelo vs GGG 3: The Trilogy Conclusion',
    description: 'The final chapter in one of boxing\'s greatest rivalries. Two warriors settle their differences once and for all.',
    type: 'full-fight',
    category: 'boxing',
    duration: '45:18',
    previewThumbnail: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=450&fit=crop',
    contentFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    isPremium: true,
    views: 890000,
    rating: 4.6,
    uploadDate: '2024-07-20',
    fighters: ['Canelo Alvarez', 'Gennady Golovkin'],
    event: 'Canelo vs GGG 3',
    organization: 'DAZN',
    weightClass: 'Super Middleweight',
    tags: ['trilogy', 'championship', 'decision']
  },
  {
    id: '3',
    title: 'ONE Championship: Muay Thai Madness',
    description: 'Explosive Muay Thai action from Singapore featuring the best strikers in the world.',
    type: 'highlight',
    category: 'muay-thai',
    duration: '12:45',
    previewThumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop',
    contentFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isPremium: false,
    views: 650000,
    rating: 4.7,
    uploadDate: '2024-07-18',
    fighters: ['Rodtang Jitmuangnon', 'Superlek Kiatmoo9'],
    event: 'ONE Friday Fights',
    organization: 'ONE Championship',
    weightClass: 'Flyweight',
    tags: ['muay-thai', 'knockout', 'thailand']
  }
];

export const livepeerService = {
  // Get all combat videos
  getCombatVideos: async () => {
    try {
      // For demo purposes, return the sample videos
      // In production, you would fetch from Livepeer API
      return COMBAT_VIDEOS;
    } catch (error) {
      console.error('Error fetching combat videos:', error);
      return COMBAT_VIDEOS; // Fallback to sample data
    }
  },

  // Get video by ID
  getVideoById: async (id) => {
    try {
      const videos = await livepeerService.getCombatVideos();
      return videos.find(video => video.id === id);
    } catch (error) {
      console.error('Error fetching video by ID:', error);
      return null;
    }
  },

  // Create a new stream (for live streaming) - Mock implementation
  createStream: async (name) => {
    try {
      // Mock stream creation
      return {
        id: `stream-${Date.now()}`,
        name: name || 'combat-stream',
        status: 'active'
      };
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  },

  // Get stream info - Mock implementation
  getStream: async (streamId) => {
    try {
      // Mock stream info
      return {
        id: streamId,
        name: 'combat-stream',
        status: 'active'
      };
    } catch (error) {
      console.error('Error getting stream:', error);
      throw error;
    }
  },

  // Get asset info - Mock implementation
  getAsset: async (assetId) => {
    try {
      // Mock asset info
      return {
        id: assetId,
        name: 'combat-video',
        status: 'ready'
      };
    } catch (error) {
      console.error('Error getting asset:', error);
      throw error;
    }
  },

  // Upload video asset - Mock implementation
  uploadAsset: async (file, name) => {
    try {
      // Mock upload
      return {
        id: `asset-${Date.now()}`,
        name: name || 'combat-video',
        status: 'uploading'
      };
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }
};

export default livepeerService; 