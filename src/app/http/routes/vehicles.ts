import { Router } from "express";
import { authConfig } from "../../../config/auth";
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
} from "../controllers/vehicles.controller";
import { authenticate } from "../middlewares/auth";
import { authorizeRole } from "../middlewares/authorize-role";

const vehiclesRouter = Router();
const sellerRole = authConfig.sellerRole ?? "seller";
const requireSeller = [authenticate, authorizeRole(sellerRole)];

vehiclesRouter.get("/", listVehicles);
vehiclesRouter.get("/:id", getVehicle);
vehiclesRouter.post("/", ...requireSeller, createVehicle);
vehiclesRouter.put("/:id", ...requireSeller, updateVehicle);
vehiclesRouter.delete("/:id", ...requireSeller, deleteVehicle);

export default vehiclesRouter;
