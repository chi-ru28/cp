const { connectDB } = require('./config/database');
const { getFertilizerKnowledge } = require('./models/FertilizerKnowledge');

const seedData = [
    { plant_name: 'Wheat', plant_type: 'Grain Crop', issue: 'Nitrogen deficiency', recommended_fertilizer: 'Urea (46-0-0)', organic_alternative: 'Compost manure', application_stage: 'Tillering stage', precaution: 'Avoid excessive nitrogen fertilizer.' },
    { plant_name: 'Rice', plant_type: 'Grain Crop', issue: 'Weak growth', recommended_fertilizer: 'NPK 20-10-10', organic_alternative: 'Cow dung manure', application_stage: 'Early growth', precaution: 'Maintain proper water levels during application.' },
    { plant_name: 'Maize', plant_type: 'Grain Crop', issue: 'Yellow leaves', recommended_fertilizer: 'Urea + DAP', organic_alternative: 'Vermicompost', application_stage: 'Vegetative stage', precaution: 'Apply near the base of the plant.' },
    { plant_name: 'Tomato', plant_type: 'Vegetable', issue: 'Poor fruiting', recommended_fertilizer: 'NPK 10-26-26', organic_alternative: 'Compost', application_stage: 'Flowering stage', precaution: 'Avoid high nitrogen during fruiting.' },
    { plant_name: 'Potato', plant_type: 'Vegetable', issue: 'Poor tuber growth', recommended_fertilizer: 'Potassium Sulfate', organic_alternative: 'Farmyard manure', application_stage: 'Tuber formation', precaution: 'Ensure soil moisture is consistent.' },
    { plant_name: 'Onion', plant_type: 'Vegetable', issue: 'Weak bulb formation', recommended_fertilizer: 'DAP + Urea', organic_alternative: 'Vermicompost', application_stage: 'Early growth', precaution: 'Do not over-irrigate after application.' },
    { plant_name: 'Garlic', plant_type: 'Vegetable', issue: 'Small bulbs', recommended_fertilizer: 'NPK 15-15-15', organic_alternative: 'Compost', application_stage: 'Vegetative stage', precaution: 'Weed regularly for best nutrient uptake.' },
    { plant_name: 'Spinach', plant_type: 'Leafy vegetable', issue: 'Yellow leaves', recommended_fertilizer: 'Nitrogen fertilizer', organic_alternative: 'Compost', application_stage: 'Early growth', precaution: 'Harvest leaves after a few days of application.' },
    { plant_name: 'Cabbage', plant_type: 'Vegetable', issue: 'Slow growth', recommended_fertilizer: 'NPK 20-20-20', organic_alternative: 'Organic compost', application_stage: 'Vegetative stage', precaution: 'Watch for head-bursting due to excess N.' },
    { plant_name: 'Cauliflower', plant_type: 'Vegetable', issue: 'Poor head formation', recommended_fertilizer: 'Urea + Potash', organic_alternative: 'Cow manure', application_stage: 'Vegetative stage', precaution: 'Protect heads from direct sunlight.' },
    { plant_name: 'Mango', plant_type: 'Fruit Tree', issue: 'Low fruit production', recommended_fertilizer: 'NPK 10-26-26', organic_alternative: 'Farmyard manure', application_stage: 'Pre-flowering', precaution: 'Apply in a ring around the trunk.' },
    { plant_name: 'Apple', plant_type: 'Fruit Tree', issue: 'Weak flowering', recommended_fertilizer: 'Potassium fertilizer', organic_alternative: 'Compost', application_stage: 'Spring', precaution: 'Prune dead wood before application.' },
    { plant_name: 'Banana', plant_type: 'Fruit Plant', issue: 'Weak plant growth', recommended_fertilizer: 'NPK 12-12-17', organic_alternative: 'Vermicompost', application_stage: 'Vegetative stage', precaution: 'Requires high potassium during growth.' },
    { plant_name: 'Orange', plant_type: 'Fruit Tree', issue: 'Poor fruit size', recommended_fertilizer: 'NPK 15-15-15', organic_alternative: 'Cow manure', application_stage: 'Flowering stage', precaution: 'Maintain regular irrigation.' },
    { plant_name: 'Lemon', plant_type: 'Fruit Tree', issue: 'Yellow leaves', recommended_fertilizer: 'Nitrogen fertilizer', organic_alternative: 'Compost', application_stage: 'Early growth', precaution: 'Check for iron deficiency as well.' },
    { plant_name: 'Grapes', plant_type: 'Fruit Plant', issue: 'Poor yield', recommended_fertilizer: 'NPK 19-19-19', organic_alternative: 'Organic compost', application_stage: 'Vegetative stage', precaution: 'Trellis properly for air circulation.' },
    { plant_name: 'Coconut', plant_type: 'Tree', issue: 'Low nut production', recommended_fertilizer: 'NPK 10-10-20', organic_alternative: 'Compost manure', application_stage: 'Rainy season', precaution: 'Apply near the active root zone.' },
    { plant_name: 'Papaya', plant_type: 'Fruit Plant', issue: 'Weak fruiting', recommended_fertilizer: 'NPK 14-14-14', organic_alternative: 'Cow manure', application_stage: 'Flowering stage', precaution: 'Susceptible to root rot if over-watered.' },
    { plant_name: 'Guava', plant_type: 'Fruit Tree', issue: 'Poor fruit quality', recommended_fertilizer: 'NPK 10-26-26', organic_alternative: 'Vermicompost', application_stage: 'Flowering stage', precaution: 'Regular pruning helps nutrient distribution.' },
    { plant_name: 'Pomegranate', plant_type: 'Fruit Tree', issue: 'Low yield', recommended_fertilizer: 'Potassium fertilizer', organic_alternative: 'Organic compost', application_stage: 'Fruit formation', precaution: 'Prevent fruit cracking with consistent water.' }
];

const seed = async () => {
    try {
        await connectDB();
        const FertilizerKnowledge = getFertilizerKnowledge();
        console.log('🌱 Seeding Fertilizer Knowledge...');
        for (const entry of seedData) {
            await FertilizerKnowledge.upsert(entry);
        }
        console.log('✅ Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
