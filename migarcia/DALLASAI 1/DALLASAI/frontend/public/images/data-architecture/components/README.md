# Data Architecture Component Images

This directory contains individual component images extracted from the PowerPoint presentation for the animated Data Flow Architecture diagram.

## How to Export Components from PowerPoint

### Step-by-Step Guide:

1. **Open the PowerPoint file:**
   - Navigate to `d:\data-architecture.pptx`
   - Open it in Microsoft PowerPoint

2. **For each component below, follow these steps:**

   a. **Select the component** (box, arrow, or group)

   b. **Right-click → Save as Picture**

   c. **Save Settings:**
      - Format: PNG (Portable Network Graphics)
      - Location: `d:\bsg-demo-platform\frontend\public\images\data-architecture\components\`
      - Use the exact filename listed below

3. **Recommended export settings:**
   - Resolution: High quality (300 DPI recommended)
   - Background: Transparent (if possible)
   - Size: Maintain aspect ratio

## Required Component Images

### Core System Components
- [ ] `core.png` - The large dark blue "Temenos Core" box
- [ ] `events.png` - "Events" box (light blue, inside Core)
- [ ] `file.png` - "File (low volume)" box (light blue, inside Core)
- [ ] `databases.png` - Database icons group at bottom (Live, Archive, NVDB)

### Middle Tier Components
- [ ] `pubsub.png` - "Pub/Sub (e.g., Kafka)" gray box
- [ ] `etl.png` - "ETL" purple box
- [ ] `data-warehouse.png` - "Data Warehouse" large purple box

### Microservices (Right Tier - Top)
- [ ] `microservices.png` - "Microservices (optional)" light blue container box
- [ ] `holdings.png` - "Holdings" component with database icon
- [ ] `party.png` - "Party" component with database icon

### Data Hub (Right Tier - Middle)
- [ ] `data-hub.png` - "Data Hub" light blue container box
- [ ] `ods.png` - "ODS" database icon
- [ ] `sds.png` - "SDS" database icon
- [ ] `ads.png` - "ADS" database icon

### Analytics (Right Tier - Bottom)
- [ ] `analytics.png` - "Analytics" light blue box with icon

### Arrows (Optional - Can be drawn with SVG)
If you want to use the original arrow designs:
- [ ] `arrow-events-pubsub.png` - Dashed orange arrow from Events to Pub/Sub
- [ ] `arrow-pubsub-microservices.png` - Dashed orange arrow with "Events" label
- [ ] `arrow-file-etl.png` - Solid turquoise arrow from File to ETL
- [ ] `arrow-etl-warehouse.png` - Arrow from ETL to Data Warehouse
- [ ] `arrow-pubsub-etl.png` - Dashed arrow labeled "Build"
- [ ] `arrow-pubsub-datahub.png` - Dashed arrow labeled "Buy"
- [ ] `arrow-datahub-analytics.png` - Solid arrow from Data Hub to Analytics
- [ ] `arrow-warehouse-analytics.png` - Dashed arrow labeled "Extracts"

## Alternative: Using Full Diagram

If extracting individual components is too time-consuming, you can:

1. Export the entire diagram as a single high-resolution PNG
2. Save it as `data-architecture-full.png` in this directory
3. Update the DataArchitectureContent component to use CSS clipping/masking

## Verification

Once images are added:
1. Start the frontend: `cd frontend && npm run dev`
2. Navigate to http://localhost:3000
3. Go to "Data Architecture" → "Content" tab
4. You should see the animated diagram with actual images instead of placeholders

## Tips for Better Results

- **Group objects** in PowerPoint before exporting to keep related elements together
- **Use transparent backgrounds** to avoid white boxes around components
- **Export at consistent resolution** for uniform appearance
- **Test one component first** to ensure the export process works correctly

## Current Status

The React component is configured and ready. Component images will replace the placeholder boxes when added to this directory.

**Last Updated:** November 13, 2025
