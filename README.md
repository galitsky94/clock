# 43,200 Broken Clocks

This project displays a collection of 43,200 unique broken clocks, each permanently fixed at a different second within a 12-hour clock cycle (from 12:00:00 AM to 11:59:59 AM).

## Concept

- Each clock represents one specific second in a 12-hour period
- Total clocks: 12 hours × 60 minutes × 60 seconds = 43,200 unique moments
- Each clock is "broken" in the sense that it's permanently stuck at its assigned time

## Features

- Browse all 43,200 clocks through a paginated interface
- Each clock is rendered using HTML Canvas for a realistic analog clock face
- Detailed view of each individual clock
- Responsive design for different screen sizes
- Keyboard navigation support (arrow keys to navigate through pages)
- Jump to specific page

## Technical Implementation

- Built with Next.js and TypeScript
- UI components from shadcn/ui
- Canvas-based clock rendering
- Static site generation for optimal performance
- Responsive design with Tailwind CSS

## Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```
npm run build
```

This will generate a static site in the `out` directory that can be deployed to any static hosting service.

## License

MIT
