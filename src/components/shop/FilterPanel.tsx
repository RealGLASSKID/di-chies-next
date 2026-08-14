"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Category, Subcategory } from "@/types/catalog";

export type ShopFilterValues = {
  category?: string | undefined;
  subcategory?: string | undefined;
  brands: string[];
  min?: number | undefined;
  max?: number | undefined;
  inStock: boolean;
  discounted: boolean;
};

export function FilterPanel({
  categories,
  subcategories,
  brands,
  values,
  onChange,
  onReset,
}: {
  categories: Category[] | undefined;
  subcategories: Subcategory[] | undefined;
  brands: string[] | undefined;
  values: ShopFilterValues;
  onChange: (patch: Partial<ShopFilterValues>) => void;
  onReset: () => void;
}) {
  const activeCategory = categories?.find((category) => category.slug === values.category);
  const relevantSubcategories = activeCategory
    ? (subcategories ?? []).filter((sub) => sub.category_id === activeCategory.id)
    : [];

  function toggleBrand(brand: string) {
    const next = values.brands.includes(brand)
      ? values.brands.filter((item) => item !== brand)
      : [...values.brands, brand];
    onChange({ brands: next });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>

      <div>
        <p className="eyebrow mb-3">Department</p>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              type="button"
              onClick={() => onChange({ category: undefined, subcategory: undefined, brands: [] })}
              className={!values.category ? "font-semibold" : "text-muted-foreground hover:text-foreground"}
            >
              All departments
            </button>
          </li>
          {categories?.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() =>
                  onChange({ category: category.slug, subcategory: undefined, brands: [] })
                }
                className={
                  values.category === category.slug
                    ? "font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {relevantSubcategories.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="eyebrow mb-3">Aisle</p>
            <ul className="space-y-1 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onChange({ subcategory: undefined })}
                  className={
                    !values.subcategory ? "font-semibold" : "text-muted-foreground hover:text-foreground"
                  }
                >
                  All aisles
                </button>
              </li>
              {relevantSubcategories.map((sub) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => onChange({ subcategory: sub.id })}
                    className={
                      values.subcategory === sub.id
                        ? "font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {sub.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Separator />

      <div>
        <p className="eyebrow mb-3">Price range (₦)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            value={values.min ?? ""}
            onChange={(event) =>
              onChange({ min: event.target.value ? Number(event.target.value) : undefined })
            }
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            value={values.max ?? ""}
            onChange={(event) =>
              onChange({ max: event.target.value ? Number(event.target.value) : undefined })
            }
            aria-label="Maximum price"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="eyebrow">Availability</p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-stock"
            checked={values.inStock}
            onCheckedChange={(checked) => onChange({ inStock: checked === true })}
          />
          <Label htmlFor="filter-stock" className="text-sm font-normal">
            In stock only
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-discount"
            checked={values.discounted}
            onCheckedChange={(checked) => onChange({ discounted: checked === true })}
          />
          <Label htmlFor="filter-discount" className="text-sm font-normal">
            On offer
          </Label>
        </div>
      </div>

      {!!brands?.length && (
        <>
          <Separator />
          <div>
            <p className="eyebrow mb-3">Brand</p>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center gap-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={values.brands.includes(brand)}
                    onCheckedChange={() => toggleBrand(brand)}
                  />
                  <Label htmlFor={`brand-${brand}`} className="text-sm font-normal">
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
