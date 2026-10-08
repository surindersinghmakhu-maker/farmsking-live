export declare enum GardenExpenseCategory {
    SEEDS = "SEEDS",
    SOIL = "SOIL",
    FERTILIZER = "FERTILIZER",
    TOOLS = "TOOLS",
    WATER = "WATER",
    POTS = "POTS",
    PESTICIDE = "PESTICIDE",
    PLANTS = "PLANTS",
    OTHER = "OTHER"
}
export declare class CreateGardenExpenseDto {
    title: string;
    amount: number;
    category: GardenExpenseCategory;
    note?: string;
    gardenId?: string;
    plantId?: string;
}
