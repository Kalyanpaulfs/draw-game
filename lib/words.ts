export const WORD_LIST = [
    "Cat", "Dog", "Bird", "Fish", "Elephant", "Lion", "Tiger", "Bear", "Monkey", "Snake",
    "House", "Car", "Bike", "Plane", "Train", "Bus", "Boat", "Ship", "Truck", "Rocket",
    "Apple", "Banana", "Orange", "Grape", "Lemon", "Lime", "Melon", "Berry", "Peach", "Pear",
    "Sun", "Moon", "Star", "Cloud", "Rain", "Snow", "Wind", "Storm", "Fire", "Water",
    "Book", "Pen", "Pencil", "Paper", "Desk", "Chair", "Table", "Bed", "Door", "Window",
    "Shirt", "Pants", "Shoe", "Hat", "Coat", "Dress", "Sock", "Glove", "Scarf", "Belt",
    "Head", "Hand", "Foot", "Leg", "Arm", "Eye", "Ear", "Nose", "Mouth", "Hair",
    "Tree", "Flower", "Grass", "Leaf", "Root", "Stem", "Rose", "Lily", "Daisy", "Tulip",
    "Phone", "Computer", "Mouse", "Keyboard", "Screen", "Laptop", "Tablet", "Camera", "Radio", "TV",
    "Ball", "Bat", "Doll", "Kite", "Game", "Toy", "Puzzle", "Cards", "Chess", "Dice",
    "King", "Queen", "Prince", "Princess", "Castle", "Dragon", "Knight", "Sword", "Shield", "Crown",
    "Pizza", "Burger", "Fries", "Hotdog", "Taco", "Sushi", "Soup", "Salad", "Bread", "Cake",
    "Coffee", "Tea", "Milk", "Juice", "Soda", "Water", "Wine", "Beer", "Coke", "Pepsi",
    "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White",
    "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Circle", "Square", "Triangle", "Rectangle", "Star", "Heart", "Diamond", "Oval", "Cross", "Arrow",
    "Smile", "Frown", "Laugh", "Cry", "Sleep", "Run", "Walk", "Jump", "Swim", "Fly",
    "Happy", "Sad", "Angry", "Scared", "Tired", "Hungry", "Thirsty", "Sick", "Hot", "Cold",
    "Big", "Small", "Tall", "Short", "Fat", "Thin", "Fast", "Slow", "Hard", "Soft",
    "Old", "New", "Good", "Bad", "Right", "Wrong", "True", "False", "Yes", "No",
    "Up", "Down", "Left", "Right", "In", "Out", "On", "Off", "Over", "Under"
];

export function getRandomWords(count: number): string[] {
    const shuffled = [...WORD_LIST].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
