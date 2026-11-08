"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CookingPot,
  Edit2,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DishItem {
  id: string;
  name: string;
  category: "Starters" | "Mains" | "Breads" | "Beverages" | "Desserts";
  price: number;
  isVeg: boolean;
  inStock: boolean;
  description: string;
  emoji: string;
}

const INITIAL_MENU: DishItem[] = [
  { id: "1", name: "Paneer Tikka (Tandoori)", category: "Starters", price: 290, isVeg: true, inStock: true, description: "Cottage cheese cubes charred with bell peppers in clay tandoor", emoji: "🧀" },
  { id: "2", name: "Murgh Malai Tikka", category: "Starters", price: 340, isVeg: false, inStock: true, description: "Tender boneless chicken marinated in cashew cream & cardamom", emoji: "🍗" },
  { id: "3", name: "Crispy Corn & Waterchestnut", category: "Starters", price: 240, isVeg: true, inStock: true, description: "Fried sweet corn tossed with lime salt and spring onions", emoji: "🌽" },
  { id: "4", name: "Tandoori Chicken Wings", category: "Starters", price: 310, isVeg: false, inStock: false, description: "Smoky tandoori wings glazed with spicy mint butter", emoji: "🍖" },

  { id: "5", name: "Dal Makhani (Slow-Cooked)", category: "Mains", price: 320, isVeg: true, inStock: true, description: "Black lentils simmered overnight with fresh churned butter", emoji: "🍲" },
  { id: "6", name: "Butter Chicken (Old Delhi)", category: "Mains", price: 420, isVeg: false, inStock: true, description: "Shredded chicken in rich buttery makhani gravy", emoji: "🥘" },
  { id: "7", name: "Kadhai Paneer", category: "Mains", price: 310, isVeg: true, inStock: true, description: "Paneer cubes with roasted coriander seeds and capsicum", emoji: "🫕" },
  { id: "8", name: "Hyderabadi Chicken Biryani", category: "Mains", price: 390, isVeg: false, inStock: true, description: "Dum cooked basmati rice with spiced chicken, mint & saffron", emoji: "🍚" },

  { id: "9", name: "Butter Naan", category: "Breads", price: 65, isVeg: true, inStock: true, description: "Clay oven baked flatbread glazed with melted butter", emoji: "🫓" },
  { id: "10", name: "Garlic & Cheese Naan", category: "Breads", price: 95, isVeg: true, inStock: true, description: "Topped with fresh minced garlic and molten cheese", emoji: "🧀" },
  { id: "11", name: "Tandoori Roti", category: "Breads", price: 40, isVeg: true, inStock: true, description: "Crisp whole wheat bread straight from tandoor", emoji: "🫓" },

  { id: "12", name: "Sweet Lassi (Kulhad)", category: "Beverages", price: 110, isVeg: true, inStock: true, description: "Traditional churned curd drink with thick malai topping", emoji: "🥛" },
  { id: "13", name: "Blue Lagoon Mocktail", category: "Beverages", price: 160, isVeg: true, inStock: true, description: "Sparkling curacao cooler with crushed ice and mint", emoji: "🍹" },

  { id: "14", name: "Gulab Jamun with Rabdi", category: "Desserts", price: 180, isVeg: true, inStock: true, description: "Warm mawa dumplings served over chilled saffron rabdi", emoji: "🍯" },
  { id: "15", name: "Kesar Pista Kulfi", category: "Desserts", price: 140, isVeg: true, inStock: true, description: "Slow reduced milk frozen dessert with crushed pistachios", emoji: "🍨" },
];

export default function DemoMenuPage() {
  const [menuItems, setMenuItems] = useState<DishItem[]>(INITIAL_MENU);
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New Dish Form State
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<DishItem["category"]>("Starters");
  const [newPrice, setNewPrice] = useState("");
  const [newIsVeg, setNewIsVeg] = useState(true);
  const [newDesc, setNewDesc] = useState("");

  const toggleStock = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item)),
    );
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    const newItem: DishItem = {
      id: "dish-" + Date.now(),
      name: newName,
      category: newCat,
      price: parseFloat(newPrice) || 250,
      isVeg: newIsVeg,
      inStock: true,
      description: newDesc || "Chef's special recipe prepared with fresh ingredients",
      emoji: newIsVeg ? "🥗" : "🍗",
    };

    setMenuItems((prev) => [newItem, ...prev]);
    setAddModalOpen(false);
    setNewName("");
    setNewPrice("");
    setNewDesc("");
  };

  const filtered = menuItems.filter((item) => {
    const matchCat = selectedCat === "All" || item.category === selectedCat;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Menu Catalog &amp; Pricing</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {menuItems.length} Dishes
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage dish pricing, categories, veg/non-veg flags, and live availability (86 stock toggle)
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 gap-1.5 text-xs font-semibold shadow-sm"
        >
          <Plus className="size-4" />
          Add New Dish
        </Button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Starters", "Mains", "Breads", "Beverages", "Desserts"].map((cat) => {
            const count =
              cat === "All" ? menuItems.length : menuItems.filter((i) => i.category === cat).length;
            return (
              <Button
                key={cat}
                variant={selectedCat === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCat(cat)}
                className="h-8 text-xs font-medium"
              >
                {cat} ({count})
              </Button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish or ingredient…"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Dishes Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((dish) => (
          <Card
            key={dish.id}
            className={`border transition-all ${
              !dish.inStock ? "border-dashed opacity-60 bg-muted/20" : "border-border/60 hover:shadow-sm"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{dish.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex size-3.5 items-center justify-center rounded-sm border ${
                          dish.isVeg ? "border-emerald-600" : "border-rose-600"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            dish.isVeg ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                      </span>
                      <h3 className="font-semibold text-foreground text-sm leading-tight">{dish.name}</h3>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {dish.category}
                    </span>
                  </div>
                </div>

                <span className="font-bold font-mono text-base text-foreground">₹{dish.price}</span>
              </div>

              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{dish.description}</p>

              {/* Stock toggle & action bar */}
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStock(dish.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      dish.inStock ? "bg-emerald-600" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        dish.inStock ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[11px] font-medium ${
                      dish.inStock ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {dish.inStock ? "In Stock" : "86'd (Sold Out)"}
                  </span>
                </div>

                <span className="text-[11px] text-muted-foreground">GST 5% included</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Dish Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CookingPot className="size-5 text-primary" />
              Add Dish to Menu
            </DialogTitle>
            <DialogDescription>
              New item will be instantly available across POS register and QR menu
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDish} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs">Dish / Item Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Saffron Rasmalai"
                required
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium"
                >
                  <option value="Starters">Starters</option>
                  <option value="Mains">Mains</option>
                  <option value="Breads">Breads</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Selling Price (₹)</Label>
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="290"
                  required
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Food Classification</Label>
              <div className="mt-1 flex gap-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="vegType"
                    checked={newIsVeg}
                    onChange={() => setNewIsVeg(true)}
                    className="accent-emerald-600"
                  />
                  <span className="text-emerald-600 font-medium">Pure Veg (🟢)</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="vegType"
                    checked={!newIsVeg}
                    onChange={() => setNewIsVeg(false)}
                    className="accent-rose-600"
                  />
                  <span className="text-rose-600 font-medium">Non-Veg (🔴)</span>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-xs">Description / Preparation Notes</Label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Soft cottage cheese dumplings soaked in rich saffron milk"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <Button type="submit" className="w-full h-10 gap-2 font-semibold text-xs mt-2">
              <CheckCircle2 className="size-4" />
              Save Dish to Catalog
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

