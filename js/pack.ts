import Module from '../c/bin/cpack';

export type Circle = {
  x: number;
  y: number;
  r: number;
};

let running = false;

export default (update: (c: number, n: number) => void) =>
  Module({
    print: console.log,
  }).then((mod) => {
    return (data: Circle[]): Promise<Circle[]> =>
      new Promise((resolve, reject) => {
        if (running) {
          reject();
        }
        running = true;
        const datasize = Float64Array.BYTES_PER_ELEMENT;

        const doubles = data.flatMap((circ) => [circ.x, circ.y, circ.r]); // transform data into doubles list

        const buf = mod._malloc(doubles.length * datasize);

        mod.HEAPF64.set(new Float64Array(doubles), buf / datasize);

        const p = mod.addFunction(() => {
          const res = data.map((circ, i) => {
            return {
              x: mod.getValue(buf + 3 * i * datasize, 'double'),
              y: mod.getValue(buf + (3 * i + 1) * datasize, 'double'),
              r: circ.r,
            };
          });

          running = false;
          resolve(res);
        }, 'v');

        const u = mod.addFunction(update, 'vii');

        mod._pack(buf, data.length, 0.001, p.toString(), u.toString());
      });
  });
