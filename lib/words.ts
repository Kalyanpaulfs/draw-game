const EASY_WORDS = [
    "Ant", "Bat", "Bear", "Bee", "Bird", "Bug", "Cat", "Cow", "Crab", "Deer",
    "Dog", "Dove", "Duck", "Eel", "Elk", "Fish", "Fly", "Fox", "Frog", "Goat",
    "Hare", "Hawk", "Hen", "Hog", "Kiwi", "Lamb", "Lion", "Lynx", "Mole", "Moth",
    "Mule", "Owl", "Ox", "Pig", "Pug", "Rat", "Seal", "Slug", "Swan", "Tick",
    "Toad", "Tuna", "Wasp", "Wolf", "Worm", "Yak", "Zebu", "Arm", "Back", "Chin",
    "Ear", "Eye", "Face", "Foot", "Hair", "Hand", "Head", "Heel", "Hip", "Knee",
    "Leg", "Lip", "Nail", "Neck", "Nose", "Palm", "Rib", "Shin", "Skin", "Toe",
    "Arch", "Ball", "Band", "Bank", "Bar", "Bark", "Base", "Bead", "Beak", "Beam",
    "Bean", "Bear", "Beat", "Bed", "Beef", "Beer", "Bell", "Belt", "Bench", "Bill",
    "Bin", "Bird", "Boat", "Body", "Bomb", "Bone", "Book", "Boot", "Bowl", "Box",
    "Boy", "Bun", "Bus", "Bush", "Cake", "Camp", "Can", "Cap", "Car", "Card",
    "Care", "Cart", "Case", "Cash", "Cat", "Cave", "Cell", "Cent", "Chair", "Chef",
    "Chin", "Chip", "Clam", "Clap", "Clip", "Club", "Clue", "Coal", "Coat", "Coin",
    "Cola", "Cold", "Cone", "Cook", "Cool", "Cord", "Cork", "Corn", "Cost", "Crib",
    "Crow", "Cube", "Cup", "Curb", "Curl", "Date", "Deck", "Desk", "Dice", "Dirt",
    "Dish", "Dock", "Doll", "Door", "Dot", "Drum", "Duck", "Dust", "East", "Edge",
    "Egg", "Fan", "Farm", "Fast", "Feet", "Film", "Fire", "Fish", "Fist", "Flag",
    "Flat", "Flea", "Flow", "Flute", "Fog", "Food", "Fool", "Fork", "Fort", "Frog",
    "Game", "Gap", "Gas", "Gate", "Gear", "Gem", "Girl", "Glow", "Glue", "Goal",
    "Goat", "Golf", "Gown", "Grid", "Grin", "Grip", "Gum", "Gym", "Hail", "Hair",
    "Hall", "Ham", "Hand", "Hare", "Hat", "Head", "Heat", "Helm", "Help", "Herb",
    "Hide", "Hill", "Hint", "Hole", "Home", "Hook", "Hoop", "Horn", "Hose", "Hour",
    "Hug", "Hull", "Hunt", "Hut", "Ice", "Icon", "Idea", "Inch", "Ink", "Inn",
    "Iron", "Item", "Jack", "Jade", "Jail", "Jar", "Jaw", "Jazz", "Jeep", "Jet",
    "Job", "Jog", "Join", "Joke", "Jump", "Junk", "Key", "Kick", "Kid", "Kill",
    "Kiln", "King", "Kiss", "Kite", "Kiwi", "Knee", "Knot", "Lab", "Lace", "Lack",
    "Lake", "Lamb", "Lamp", "Land", "Lane", "Lap", "Last", "Lava", "Lawn", "Lead",
    "Leaf", "Leak", "Leg", "Lens", "Lid", "Life", "Lift", "Lime", "Line", "Link",
    "Lion", "Lip", "List", "Load", "Loaf", "Lock", "Log", "Loop", "Lord", "Loss",
    "Lot", "Luck", "Lump", "Lung", "Lure", "Lush", "Maid", "Mail", "Main", "Make",
    "Male", "Mall", "Map", "Mars", "Mask", "Mast", "Mat", "Mate", "Meal", "Meat",
    "Melt", "Memo", "Menu", "Mesh", "Mess", "Mile", "Milk", "Mill", "Mine", "Mint"
];

const MEDIUM_WORDS = [
    "Apple", "Angle", "Alarm", "Beach", "Bread", "Brick", "Brush", "Brain", "Clock", "Cloud",
    "Chair", "Chess", "Dance", "Dream", "Dress", "Drive", "Drink", "Eagle", "Earth", "Eight",
    "Elbow", "Fairy", "Fence", "Field", "Flame", "Flute", "Fruit", "Ghost", "Giant", "Glass",
    "Globe", "Grass", "Green", "Happy", "Heart", "Heavy", "Horse", "House", "Image", "Index",
    "Jeans", "Jelly", "Juice", "Knife", "Koala", "Label", "Laser", "Laugh", "Lemon", "Light",
    "Llama", "Lunch", "Magic", "Mango", "Metal", "Model", "Money", "Month", "Mouse", "Mouth",
    "Music", "Night", "Noise", "North", "Nurse", "Ocean", "Onion", "Opera", "Orbit", "Organ",
    "Paint", "Panel", "Paper", "Party", "Peach", "Pearl", "Phone", "Piano", "Pilot", "Pizza",
    "Plane", "Plant", "Plate", "Point", "Power", "Price", "Pride", "Prize", "Puppy", "Queen",
    "Quiet", "Radio", "Range", "Raven", "River", "Robot", "Rocket", "Round", "Scale", "Scene",
    "Scout", "Shark", "Sheep", "Shell", "Shirt", "Shock", "Snake", "Sound", "South", "Space",
    "Spoon", "Stage", "Stamp", "Steam", "Stick", "Stone", "Store", "Storm", "Story", "Straw",
    "Sugar", "Sunny", "Sword", "Table", "Taste", "Tiger", "Title", "Toast", "Tooth", "TorcH",
    "Touch", "Tower", "Track", "Trade", "Train", "Treat", "Truck", "Trust", "Uncle", "Union",
    "Unity", "Value", "Valve", "Video", "Virus", "Voice", "Watch", "Water", "Whale", "Wheel",
    "White", "Whole", "Window", "Woman", "World", "Worry", "Wreath", "Wrist", "Xerox", "Yacht",
    "Yield", "Young", "Youth", "Zebra"
];

const HARD_WORDS = [
    "Airplane", "Alphabet", "Ambulance", "Aquarium", "Astronaut", "Backpack", "Balloon", "Barbecue", "Basement", "Basketball",
    "Bathroom", "Battery", "Birthday", "Blizzard", "Blossom", "Bookcase", "Bookmark", "Bracelet", "Broccoli", "Building",
    "Bulldozer", "Butterfly", "Calendar", "Campfire", "Candle", "Carnival", "Carriage", "Cartoon", "Castle", "Cathedral",
    "Ceiling", "Ceremony", "Champion", "Chemical", "Chimney", "Chocolate", "Classroom", "Clothing", "Cocktail", "Coconut",
    "Compass", "Computer", "Concrete", "Confuse", "Congress", "Contract", "Corridor", "Costume", "Cottage", "Courage",
    "Cowboy", "Creation", "Creative", "Creature", "Criminal", "Crossing", "Crystal", "Cupboard", "Customer", "Cylinder",
    "Daughter", "Daylight", "Decision", "Decorate", "Decrease", "Delivery", "Dentist", "Deposit", "Describe", "Desert",
    "Designer", "Destroy", "Detective", "Diagram", "Dialogue", "Diamond", "Dinosaur", "Diploma", "Director", "Disaster",
    "Discount", "Discover", "Disease", "Disguise", "Distance", "District", "Dividend", "Division", "Doctor", "Document",
    "Dolphin", "Domestic", "Dominoes", "Donation", "Donkey", "Doorbell", "Doormat", "Doorstep", "Dormitory", "Draftsman",
    "Dragonfly", "Drainage", "Drawers", "Dreamer", "Dresser", "Dressing", "Driveway", "Drought", "Drummer", "Drunkard",
    "Duckling", "Dumbbell", "Dungeon", "Dustbin", "Dynamite", "Earrings", "Earthworm", "Easier", "Educate", "Eggplant",
    "Egyptian", "Elastic", "Election", "Electric", "Elephant", "Elevator", "Emerald", "Employee", "Engineer", "Entrance",
    "Envelope", "Equation", "Equator", "Equipment", "Eruption", "Escalator", "Espresso", "Evening", "Evidence", "Exchange",
    "Excitement", "Exercise", "Exhibit", "Existent", "Explorer", "Explosion", "External", "Eyeballs", "Eyebrows", "Eyelids",
    "Fabric", "Factory", "Failure", "Fairies", "Falcon", "Family", "Fanatic", "Fantasy", "Farewell", "Farmer",
    "Fashion", "Father", "Faucet", "Feather", "Feature", "February", "Festival", "Fiction", "Figurine", "Finance",
    "Finger", "Fireball", "Firefly", "Fireman", "Fireplace", "Firework", "Fishbowl", "Fisherman", "Fistful", "Flamingo",
    "Flashlight", "Flatware", "Flavor", "Flexible", "Flight", "Flipper", "Floating", "Flower", "Flyswatter", "Football",
    "Footwear", "Forehead", "Forest", "Forever", "Forgive", "Formula", "Fortress", "Fortune", "Fountain", "Fragment"
];

import { Difficulty } from "./types";

export function getRandomWords(count: number, difficulty: Difficulty): string[] {
    let pool: string[] = [];

    if (difficulty === "easy") pool = EASY_WORDS;
    else if (difficulty === "medium") pool = MEDIUM_WORDS;
    else pool = HARD_WORDS;

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
