import type { Meta, StoryObj } from '@storybook/react-vite';

import { fn } from 'storybook/test';

import { VehicleAppraisalPage } from '../components/pages/VehicleAppraisalPage';
import { type Photo } from '../components/molecules/PhotoGrid';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Pages/VehicleAppraisalPage',
  component: VehicleAppraisalPage,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // Use `fn` to spy on the callback args, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    onVinChange: fn(),
    onAnalyze: fn(),
    onUpload: fn(),
  },
} satisfies Meta<typeof VehicleAppraisalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock photos for stories
const mockPhotos: Photo[] = [
  { id: '1', url: 'https://via.placeholder.com/200x200?text=Photo+1', alt: 'Front view' },
  { id: '2', url: 'https://via.placeholder.com/200x200?text=Photo+2', alt: 'Side view' },
  { id: '3', url: 'https://via.placeholder.com/200x200?text=Photo+3', alt: 'Rear view' },
];

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {},
};

export const WithInitialVin: Story = {
  args: {
    vin: '1HGCM82633A123456',
  },
};

export const WithInitialPhotos: Story = {
  args: {
    photos: mockPhotos,
  },
};

export const Uploading: Story = {
  args: {
    photos: mockPhotos,
    isUploading: true,
    uploadProgress: { current: 2, total: 5 },
  },
};

export const WithInitialComplete: Story = {
  args: {
    vin: '1HGCM82633A123456',
    photos: mockPhotos,
    uploadProgress: { current: 5, total: 5 },
  },
};
