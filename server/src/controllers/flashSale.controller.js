import { flashSaleService } from "../services/flashSale.service.js";

export const launchSale = (req, res) => {
  res.status(201).json(flashSaleService.launch(req.body));
};

export const listCurrentSales = (_req, res) => {
  res.json(flashSaleService.listCurrent());
};

export const claimSale = async (req, res) => {
  res.status(201).json(await flashSaleService.claim(req.params.id, req.body.customer));
};

export const confirmSale = async (req, res) => {
  res.status(201).json(await flashSaleService.confirm(req.params.id, req.body.customer));
};

export const releaseSale = async (req, res) => {
  res.json(await flashSaleService.release(req.params.id, req.body.customer));
};

export const endSale = (req, res) => {
  res.json(flashSaleService.end(req.params.id));
};
