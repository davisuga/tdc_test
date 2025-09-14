import { assessVehicle, type AssessInput } from './engine';
import { saveAssessment } from './persistence';
import { fetchVehicleInfo } from '../../services/nhtsa';
import { fetchMarketData } from '../../services/marketcheck';
import { S3Client } from 'bun';

export async function runBackgroundAssessment(
  vinSubmissionId: string,
  vin: string,
  mileage: number,
  description: string,
  s3Paths: string[]
) {
  try {
    console.log(`Starting background assessment for submission ${vinSubmissionId}`);
    
    // Initialize S3 client
    const s3Client = new S3Client({
      bucket: "tdc-photos",
      endpoint: process.env.S3_ENDPOINT || "s3.us-west-001.backblazeb2.com",
    });

    // 1. Fetch and convert images from S3 to base64
    const photosWithData: { data: string; mediaType: string }[] = [];
    for (const s3Path of s3Paths) {
      try {
        console.log(`Fetching image from S3: ${s3Path}`);
        const imageBuffer = await s3Client.file(s3Path).arrayBuffer();
        const base64Data = Buffer.from(imageBuffer).toString('base64');
        
        // Determine media type from file extension
        const extension = s3Path.split('.').pop()?.toLowerCase();
        const mediaType = extension === 'png' ? 'image/png' : 
                         extension === 'webp' ? 'image/webp' : 
                         extension === 'gif' ? 'image/gif' : 'image/jpeg';
        
        photosWithData.push({
          data: base64Data,
          mediaType
        });
        console.log(`Successfully converted ${s3Path} to base64`);
      } catch (error) {
        console.error(`Failed to fetch image ${s3Path}:`, error);
        // Continue with other images even if one fails
      }
    }

    if (photosWithData.length === 0) {
      throw new Error('No images could be fetched from S3');
    }
    
    // 2. Fetch NHTSA data for VIN decode
    let nhtsaData;
    try {
      nhtsaData = await fetchVehicleInfo(vin);
      console.log(`NHTSA data fetched for VIN: ${vin}`);
    } catch (error) {
      console.warn(`Failed to fetch NHTSA data for VIN ${vin}:`, error);
    }

    // 3. Fetch market data if we have vehicle details
    let marketData;
    if (nhtsaData?.Results?.[0]) {
      const vehicleInfo = nhtsaData.Results[0];
      try {
        marketData = await fetchMarketData({
          year: Number(vehicleInfo.ModelYear),
          make: vehicleInfo.Make,
          model: vehicleInfo.Model,
          mileage: mileage,
        });
        console.log(`Market data fetched: ${marketData.num_found} listings found`);
      } catch (error) {
        console.warn(`Failed to fetch market data:`, error);
      }
    }

    // 4. Prepare assessment input
    const assessInput: AssessInput = {
      mileage,
      description: description || '',
      photos: photosWithData, // Base64 image data
      vin,
      nhtsa: nhtsaData,
      market: marketData,
    };

    // 5. Run AI assessment
    console.log(`Running AI assessment with ${photosWithData.length} photos`);
    const assessment = await assessVehicle(assessInput);

    // 6. Save to database
    console.log(`Saving assessment to database`);
    const savedAssessment = await saveAssessment(assessment, vinSubmissionId);

    console.log(`Background assessment completed for submission ${vinSubmissionId}`);
    return savedAssessment;
  } catch (error) {
    console.error(`Background assessment failed for submission ${vinSubmissionId}:`, error);
    throw error;
  }
}
