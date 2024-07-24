"use strict";
const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job{
    /**Create a job from data {title, salary, equity, companyHandle}
       Returns {id, title, salary, equity, companyHandle} **/
    static async create(data){
        const res = await db.query(`INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4) RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [data.title, data.salary, data.equity, data.companyHandle]);

        let job = res.rows[0];
        return job;
    }


    /** Find all jobs with optional filter for title, min salary, and has equity
        Return [{id, title, salary, equity, companyHandle, companyName}...] **/
   static async findAll({minSalary, hasEquity, title} = {}){
        let query = `SELECT jobs.id, jobs.title, jobs.salary, jobs.equity, jobs.company_handle AS "companyHandle", companies.name AS "companyName"
        FROM jobs LEFT JOIN comapnies ON companies.handle = jobs.company_handle`;

        let searchFilter = [];
        let searchQuery = [];

        //Check for each possible search filter
        if(minSalary !== undefined){
            searchQuery.push(minSalary);
            searchFilter.push(`salary >= $${searchQuery.length}`);
        }
        if(hasEquity === true){
            searchFilter.push(`equity > 0`);
        }
        if(title !== undefined){
            searchQuery.push(`%${title}%`);
            searchFilter.push(`title ILIKE $${searchQuery.length}`);
        }


        if(searchFilter.length > 0){
            query += " WHERE " + searchFilter.join("AND");
        }

        query += " ORDER BY title";
        const jobSearch = await db.query(query, searchQuery);
        return jobSearch.rows;
    }

    /** Get job by id
        Returns {id, title, salary, equity, company{handle, name, description, numEmplotees, logoUrl}} **/
    static async get(id){
        const jobSearch = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs WHERE id = $1`, [id]);    
        const job = jobSearch.rows[0];
        
        if(!job)
            throw new NotFoundError(`No job found: ${id}`);

        const companyInfo = await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" 
            FROM companies WHERE handle = $1`, 
            [job.companyHandle]);
            
        delete job.companyHandle;
        job.company = companyInfo.rows[0];
        return job;
    }

    /** Update job data
        Returns {id, title, salary, equity, companyHandle} **/
    static async update(id, data){
        const {setCols, values } = sqlForPartialUpdate(data, {});
        const jobIdIdx = "$" + (values.length + 1);

        const sqlQuery = `UPDATE jobs SET ${setCols} WHERE id = ${jobIdIdx} 
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

        const res = await db.query(sqlQuery, [...values, id]);
        const job = res.rows[0];

        if(!job)
            throw new NotFoundError(`No job found: ${id}`);

        return job;
    }

    /** Delete a job **/
    static async delete(id){
        const res = await db.query(`DELETE FROM jobs WHERE id = $1 RETURNING id`, [id]);
        const job = res.rows[0];

        if(!job)
            throw new NotFoundError(`No job found: ${id}`);
    }
}

module.exports = Job;