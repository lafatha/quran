"use client";

interface PrayerLocationFormProps {
  province: string;
  city: string;
  provinces: string[];
  cities: string[];
  provinceLoading: boolean;
  cityLoading: boolean;
  saving: boolean;
  errorMessage: string | null;
  helperText?: string;
  submitLabel: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSubmit: () => void;
}

export default function PrayerLocationForm({
  province,
  city,
  provinces,
  cities,
  provinceLoading,
  cityLoading,
  saving,
  errorMessage,
  helperText,
  submitLabel,
  onProvinceChange,
  onCityChange,
  onSubmit,
}: PrayerLocationFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          Provinsi
        </label>
        <select
          value={province}
          onChange={(event) => onProvinceChange(event.target.value)}
          disabled={provinceLoading || saving}
          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition focus:border-black"
        >
          <option value="">
            {provinceLoading ? "Memuat provinsi..." : "Pilih provinsi"}
          </option>
          {provinces.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          Kota / Kabupaten
        </label>
        <select
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          disabled={!province || cityLoading || saving}
          className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition focus:border-black disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">
            {!province
              ? "Pilih provinsi terlebih dahulu"
              : cityLoading
                ? "Memuat kota..."
                : "Pilih kota / kabupaten"}
          </option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {helperText && (
        <p className="text-xs leading-5 text-gray-500">
          {helperText}
        </p>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!province || !city || provinceLoading || cityLoading || saving}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-md shadow-black/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : submitLabel}
      </button>
    </div>
  );
}
