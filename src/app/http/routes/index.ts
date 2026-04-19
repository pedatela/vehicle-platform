import { Router } from 'express';
import vehiclesRouter from './vehicles';
import internalRouter from './internal';

const routes = Router();

routes.use('/vehicles', vehiclesRouter);
routes.use('/internal', internalRouter);

export default routes;
