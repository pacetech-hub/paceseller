// Escala do eixo Y ajustada aos dados: sem faixa vazia enorme acima ou abaixo da série,
// apenas uma folga pequena (~10%) acima do maior valor. Use em `yAxisProps={{ domain: … }}`.
//
// - Linhas/áreas: o eixo começa perto do menor valor (não em zero), para a variação aparecer.
// - Barras: o eixo começa em zero (barras cortadas enganam) e termina logo acima do maior valor.

type Bound = (v: number) => number;

const niceFloor = (v: number) => {
  if (v <= 0) return Math.floor(v);
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.floor(v / mag) * mag;
};

const padTop: Bound = max => Math.ceil(max * 1.1);

/** Linhas e áreas: do menor valor (arredondado para baixo, com ~10% de folga) até o maior + 10%. */
export const lineDomain: [Bound, Bound] = [
  min => Math.max(0, niceFloor(min * 0.9)),
  padTop,
];

/** Barras: de zero até o maior valor + 10%. */
export const barDomain: [number, Bound] = [0, padTop];
