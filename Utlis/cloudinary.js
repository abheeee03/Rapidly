import { Cloudinary } from '@cloudinary/url-gen';
import { scale } from '@cloudinary/url-gen/actions/resize';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { auto, vp9 } from '@cloudinary/url-gen/qualifiers/videoCodec';
import { byFolder } from '@cloudinary/url-gen/qualifiers/source';
import 'react-native-url-polyfill/auto';

// Get Cloudinary credentials from environment variables
const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvd9p28iu';
const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

console.log('Cloudinary Config:', { cloudName, apiKey: apiKey ? '✓' : '✗', apiSecret: apiSecret ? '✓' : '✗' });

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: { cloudName, secure: true }
});

// Fallback videos to use if a specific video fails to load
const FALLBACK_VIDEOS = {
  default: 'https://res.cloudinary.com/demo/video/upload/v1389481363/dog.mp4',
  nature: 'https://res.cloudinary.com/demo/video/upload/v1543863326/sea_turtle.mp4',
  animals: 'https://res.cloudinary.com/demo/video/upload/v1526039272/elephants.mp4'
};

// Function to get video URL with desired options
export const getVideoUrl = (publicId, width = 720, height = 1280, qualityLevel = 'auto') => {
  try {
    return cld.video(publicId)
      .resize(scale().width(width).height(height))
      .delivery(quality(qualityLevel))
      .toURL();
  } catch (error) {
    console.error('Error generating video URL:', error);
    return FALLBACK_VIDEOS.default;
  }
};

// Function to get video thumbnail
export const getVideoThumbnail = (publicId, width = 720, height = 1280, time = '0.1') => {
  try {
    // Construct thumbnail URL
    // For example: https://res.cloudinary.com/cloud_name/video/upload/so_0.1,w_720,h_1280/publicId.jpg
    const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;
    const transformations = `so_${time},w_${width},h_${height}`;
    return `${baseUrl}/${transformations}/${publicId}.jpg`;
  } catch (error) {
    console.error('Error generating thumbnail URL:', error);
    return `https://res.cloudinary.com/demo/video/upload/so_0.1,w_${width},h_${height}/dog.jpg`;
  }
};

// Function to fetch videos from Cloudinary
export const fetchCloudinaryVideos = async (folder = '') => {
  try {
    console.log(`Fetching Cloudinary videos from folder: "${folder}"`);
    
    // If API key and secret are not available, return sample videos
    if (!apiKey || !apiSecret) {
      console.log('API keys not available, returning sample videos');
      return getSampleVideos();
    }
    
    // Construct API URL for listing resources
    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/video`;
    
    // Prepare authentication headers using API key and secret
    const auth = btoa(`${apiKey}:${apiSecret}`);
    
    // Set up query parameters
    const params = new URLSearchParams();
    params.append('max_results', 30); // Fetch up to 30 videos
    
    // Add prefix parameter if folder is specified
    if (folder) {
      params.append('prefix', folder);
    }
    
    // Make API request to get videos
    console.log(`Making request to ${apiUrl}?${params.toString()}`);
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Parse response
    const data = await response.json();
    
    // Handle API errors
    if (data.error) {
      console.error('Cloudinary API error:', data.error);
      throw new Error(data.error.message || 'Error fetching videos from Cloudinary');
    }
    
    // Check if resources are available
    if (!data.resources || data.resources.length === 0) {
      console.log('No videos found in the specified folder');
      return [];
    }
    
    console.log(`Found ${data.resources.length} videos`);
    
    // Map resources to video objects
    return data.resources.map(resource => {
      try {
        const publicId = resource.public_id;
        
        // Extract video name from public_id
        let title = publicId.split('/').pop();
        title = title.replace(/_/g, ' ').replace(/-/g, ' ');
        
        // Create a random number of likes and comments
        const likes = Math.floor(Math.random() * 1000) + 10;
        const comments = Math.floor(Math.random() * 100) + 5;
        
        // Calculate fallback category based on folder or tags
        let fallbackCategory = 'default';
        if (resource.tags && resource.tags.includes('nature')) fallbackCategory = 'nature';
        if (resource.tags && resource.tags.includes('animals')) fallbackCategory = 'animals';
        
        return {
          id: resource.asset_id || publicId,
          publicId: publicId,
          title: title.charAt(0).toUpperCase() + title.slice(1), // Capitalize first letter
          description: `Video uploaded to Cloudinary folder: ${resource.folder || 'root'}`,
          likes: likes,
          comments: comments,
          url: getVideoUrl(publicId),
          fallbackUrl: FALLBACK_VIDEOS[fallbackCategory],
          thumbnail: getVideoThumbnail(publicId),
          format: resource.format,
          bytes: resource.bytes,
          duration: resource.duration,
          created_at: resource.created_at,
          width: resource.width,
          height: resource.height,
          tags: resource.tags || [],
          folder: resource.folder || 'root'
        };
      } catch (error) {
        // If there's an error processing a specific video, return a fallback
        console.error('Error processing video resource:', error);
        return createFallbackVideo();
      }
    }).filter(Boolean); // Remove any null entries
  } catch (error) {
    console.error('Error fetching Cloudinary videos:', error);
    
    // If there's an error, return sample videos
    console.log('Returning sample videos due to error');
    return getSampleVideos();
  }
};

// Function to create a fallback video in case of errors
const createFallbackVideo = () => {
  const now = new Date();
  
  return {
    id: `fallback-${Date.now()}`,
    publicId: 'samples/dog',
    title: 'Fallback Video',
    description: 'This is a fallback video when the original could not be processed',
    likes: 42,
    comments: 7,
    url: FALLBACK_VIDEOS.default,
    fallbackUrl: FALLBACK_VIDEOS.default,
    thumbnail: `https://res.cloudinary.com/demo/video/upload/so_0.1/dog.jpg`,
    format: 'mp4',
    bytes: 5242880, // 5MB
    duration: 30,
    created_at: now.toISOString(),
    width: 640,
    height: 360,
    tags: ['fallback'],
    folder: 'samples'
  };
};

// Function to get sample videos (fallback)
const getSampleVideos = () => {
  // Create dates for sorting demonstration
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const samples = [
    {
      id: 'sample1',
      publicId: 'samples/elephants',
      title: 'Elephants Dream',
      description: 'Sample Cloudinary demo video of elephants in the wild',
      likes: 532,
      comments: 32,
      format: 'mp4',
      duration: 60.5,
      bytes: 24908544,
      created_at: yesterday.toISOString(),
      width: 1280,
      height: 720,
      tags: ['animals', 'wildlife'],
      folder: 'samples',
      url: FALLBACK_VIDEOS.animals,
      fallbackUrl: FALLBACK_VIDEOS.animals,
      thumbnail: `https://res.cloudinary.com/demo/video/upload/so_0.1/elephants.jpg`,
    },
    {
      id: 'sample2',
      publicId: 'samples/sea',
      title: 'Sea and Waves',
      description: 'Beautiful ocean waves crashing on the shore',
      likes: 872,
      comments: 43,
      format: 'mp4',
      duration: 42.8,
      bytes: 18350080,
      created_at: now.toISOString(),
      width: 1280,
      height: 720,
      tags: ['nature', 'ocean'],
      folder: 'samples',
      url: FALLBACK_VIDEOS.nature,
      fallbackUrl: FALLBACK_VIDEOS.nature,
      thumbnail: `https://res.cloudinary.com/demo/video/upload/so_0.1/sea_turtle.jpg`,
    },
    {
      id: 'sample3',
      publicId: 'samples/cld-sample-video',
      title: 'Cloudinary Sample Video',
      description: 'Official Cloudinary sample video for demonstration purposes',
      likes: 734,
      comments: 57,
      format: 'mp4',
      duration: 22.3,
      bytes: 9856431,
      created_at: lastWeek.toISOString(),
      width: 1280,
      height: 720,
      tags: ['demo', 'sample'],
      folder: 'samples',
      url: FALLBACK_VIDEOS.default,
      fallbackUrl: FALLBACK_VIDEOS.default,
      thumbnail: `https://res.cloudinary.com/demo/video/upload/so_0.1/dog.jpg`,
    }
  ];
  
  return samples;
}; 