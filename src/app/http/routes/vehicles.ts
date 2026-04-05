import { Router } from "express";
import { authConfig } from "../../../config/auth";
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
} from "../controllers/vehicles.controller";

const vehiclesRouter = Router();
const sellerRole = authConfig.sellerRole ?? "seller";

vehiclesRouter.get("/", listVehicles);
vehiclesRouter.get("/:id", getVehicle);
vehiclesRouter.post("/", createVehicle);
vehiclesRouter.put("/:id", updateVehicle);
vehiclesRouter.delete("/:id", deleteVehicle);

export default vehiclesRouter;
