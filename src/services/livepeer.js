import { Livepeer } from "livepeer";

// Initialize Livepeer client
const livepeer = new Livepeer({
  apiKey: import.meta.env.VITE_LIVEPEER_API_KEY || 'your-api-key-here'
});

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

  // Create a new stream (for live streaming)
  createStream: async (name) => {
    try {
      const response = await livepeer.stream.create({
        name: name || 'combat-stream'
      });
      return response;
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  },

  // Get stream info
  getStream: async (streamId) => {
    try {
      const response = await livepeer.stream.get(streamId);
      return response;
    } catch (error) {
      console.error('Error getting stream:', error);
      throw error;
    }
  },

  // Get asset info
  getAsset: async (assetId) => {
    try {
      const response = await livepeer.asset.get(assetId);
      return response;
    } catch (error) {
      console.error('Error getting asset:', error);
      throw error;
    }
  },

  // Upload video asset
  uploadAsset: async (file, name) => {
    try {
      const response = await livepeer.asset.create({
        input: file,
        name: name || 'combat-video'
      });
      return response;
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }
};

export default livepeerService; 