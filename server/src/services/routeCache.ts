import type { LatLng, RouteResult } from '@lcn/shared';

const routeKey = (from: LatLng, to: LatLng) => `${from.lat},${from.lng}->${to.lat},${to.lng}`;

/** Кеш готових маршрутів обмеженого розміру: при переповненні витісняється найстаріший запис */
export class RouteCache {
  private readonly routes = new Map<string, RouteResult>();
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(from: LatLng, to: LatLng): RouteResult | undefined {
    return this.routes.get(routeKey(from, to));
  }

  set(from: LatLng, to: LatLng, route: RouteResult) {
    if (this.routes.size >= this.capacity) this.routes.delete(this.routes.keys().next().value!);
    this.routes.set(routeKey(from, to), route);
  }
}
