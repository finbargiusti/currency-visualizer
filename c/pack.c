#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <emscripten.h>

#define PI 3.141592654

#define TAU PI * 2

// returns distance between two circles
double dist(double *c1, double *c2)
{
  // pointers point specifically to the x of c1 and c2

  double c1x = *c1;
  double c1y = *(c1 + 1);

  double c2x = *c2;
  double c2y = *(c2 + 1);

  double diffX = c2x - c1x;
  double diffY = c2y - c1y;

  double dist = sqrt(pow(diffX, 2) + pow(diffY, 2));

  return dist;
}

// If two circles c1 and c2 intersect, returns 0
int intersect(double *c1, double *c2)
{
  double distance = dist(c1, c2);

  double c1r = *(c1 + 2);
  double c2r = *(c2 + 2);

  return (distance < (c1r + c2r)) ? 0 : -1;
}

// If circle c1 intersects with any circle in t, return 0
int intersectsAny(double *c1, double *t, int n)
{
  for (int i = 0; i < n; i++)
  {
    if (intersect(c1, t) == 0)
    {
      return 0;
    }
    t += 3;
  }
  return -1;
}

int pack(double *circles, int n, void (*finish)(void), void (*update_counter)(int c, int n))
{
  // intialise circle 1 in center

  *circles = 0.0;
  *(circles + 1) = 0.0;

  // find spots for rest of circles

  const int GRANULARITY = 980; // degrees per rotation

  const double STEP_OUT = 0.001; // change in search circle size

  const double START_DELTA = *(circles + 2);

  double delta = START_DELTA; // current search size

  int n_calculated = 1;

  int angle = 1;

  (*update_counter)(1, n);

  // Start at second circle
  double *curr = circles + 3;

  for (int i = 1; i < n; i++)
  {

    while (1)
    {
      // iterate round circle

      *curr = delta * cos((angle * TAU) / GRANULARITY);
      *(curr + 1) = delta * sin((angle * TAU) / GRANULARITY);

      if (intersectsAny(curr, circles, n_calculated) != 0)
      {
        break;
      }

      if (angle == GRANULARITY)
      { // if full circle complete
        // reset angle and increase delta

        angle = 1;
        delta += STEP_OUT;
      }

      angle++;
    }

    (*update_counter)(i + 1, n);
    emscripten_sleep(0);
    delta = START_DELTA;
    n_calculated++;
    curr += 3;
  }

  (*update_counter)(n, n);
  emscripten_sleep(0);

  (*finish)();

  return 0;
}