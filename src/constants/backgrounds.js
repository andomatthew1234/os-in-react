import { withBase } from '../utils/paths';

export const BACKGROUNDS = {
  mojave: {
    label: 'Mojave',
    variants: {
      light: withBase('bg/mojave_light.jpg'),
      dark: withBase('bg/mojave_dark.jpg')
    }
  },
  slide: {
    label: 'Slide',
    variants: {
      light: withBase('bg/slide_light.jpg'),
      dark: withBase('bg/slide_dark.jpg')
    }
  },
  rect_curves: {
    label: 'Rectangle Curves',
    variants: {
      red: withBase('bg/rect_curves/red.jpg'),
      blue: withBase('bg/rect_curves/blue.jpg'),
      green: withBase('bg/rect_curves/green.jpg'),
      purple: withBase('bg/rect_curves/purple.jpg')
    }
  }
};

export const BACKGROUND_OPTIONS = [
  {
    id: 'mojave',
    label: 'Mojave',
    type: 'lightdark',
    variants: [
      { id: 'light', label: 'Light' },
      { id: 'dark', label: 'Dark' }
    ]
  },
  {
    id: 'slide',
    label: 'Slide',
    type: 'lightdark',
    variants: [
      { id: 'light', label: 'Light' },
      { id: 'dark', label: 'Dark' }
    ]
  },
  {
    id: 'rect_curves',
    label: 'Rectangle Curves',
    type: 'color',
    variants: [
      { id: 'red', label: 'Red' },
      { id: 'blue', label: 'Blue' },
      { id: 'green', label: 'Green' },
      { id: 'purple', label: 'Purple' }
    ]
  }
];
