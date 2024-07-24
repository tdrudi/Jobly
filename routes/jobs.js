"use strict";

const jsonschema = require("jsonschema");
const express = require("express");

const {BadRequestError} = require("../expressError");
const {ensureAdmin} = require("../middleware/auth");

const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router();

/** POST / 
    job => {title, salary, equity, companyHandle}
    returns => {id, title, salary, equity, companyHandle}
    Admin auth required
**/

router.post("/", ensureAdmin, async function (req, res, next){
    try{
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid){
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({job});
    }catch(err){
        return next(err);
    }
});

/** GET / 
    Can filter by min salary, has equirt, and title

    return json jobs list 
    
**/
router.get("/", async function (req, res, next){
    const searchQuery = req.query;
    if(searchQuery.minSalary !== undefined)
        searchQuery.minSalary = +searchQuery.minSalary;
    if(searchQuery.hasEquity)
        searchQuery.hasEquity = "true";

    try{
        const validator = jsonschema.validate(searchQuery, jobSearchSchema);
        if(!validator.valid){
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }

        const jobs = await Job.findAll(searchQuery);
        return res.json({jobs});
    }catch(err){
        return next(err);
    }
});

/** GET /:id  
    Return job with id **/
router.get("/:id", async function(req, res, next){
    try{
        const job = await Job.get(req.params.id);
        return res.json({job});
    }catch (err){
        next(err);
    }
});

/** PATCH job by id
    Returns {id, title, salary, equirt, companyHandle
    Admin auth required**/
router.patch("/:id", ensureAdmin, async function (req, res, next){
    try{
        const validator = jsonschema.validate(searchQuery, jobUpdateSchema);
        if(!validator.valid){
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({job});
    }catch(err){
        next(err);
    }
});

/**DELETE job by id 
    Admin auth required**/
router.delete("/:id", ensureAdmin, async function(req, res, next){
    try{
        await Job.remove(req.params.id);
        return res.json({deleted: +req.params.id});
    }catch(err){
        return next(err);
    }
});

module.exports = router;