declare module 'jalali-convertor' {
  interface JalaliConvertor {
    g2j(year: number, month: number, day: number): [number, number, number];
    j2g(year: number, month: number, day: number): [number, number, number];
  }

  const date: JalaliConvertor;
  export default date;
} 