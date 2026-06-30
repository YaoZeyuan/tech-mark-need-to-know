import type { CountryCode, ProductId } from "./types";
import { COUNTRIES, PRODUCTS } from "./constants";

export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(Number(value || 0));

export const formatMoney = (value: number) => `${formatNumber(Number(value || 0))} 尤元`;

export const countryName = (code: CountryCode) => COUNTRIES.find((country) => country.code === code)?.name ?? code;

export const productName = (id: ProductId) => PRODUCTS.find((product) => product.id === id)?.name ?? id;

export const percentText = (value: number) => `${Number(value || 0).toFixed(1)}%`;

export const compactJson = (value: unknown) => JSON.stringify(value, null, 2);
