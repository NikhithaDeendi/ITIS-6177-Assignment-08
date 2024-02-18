const express = require('express');
const { body, validationResult } = require('express-validator');
const { param } = require('express-validator');
const cors = require('cors');
const mariadb = require('mariadb');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const port = 3000;

// Database configuration
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sample',
    port: 3306,
    connectionLimit: 5
});

// Middleware
// Middleware
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { swaggerOptions: { url: 'http://142.93.60.109:3000/swagger.json' } })); // Serve Swagger UI with the imported Swagger JSON file
app.use(cors());
app.use(express.json());

// Routes

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Returns all agents
 *     description: Retrieve a list of all agents.
 *     responses:
 *       200:
 *         description: A list of agents.
 *       500:
 *         description: Internal server error.
 */
app.get('/agents', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM agents");
        res.json(rows);
        conn.release();
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || "Internal server error"
        });
    }
});


/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Returns all companies
 *     description: Retrieve a list of all companies.
 *     responses:
 *       200:
 *         description: A list of companies.
 *       500:
 *         description: Internal server error.
 */

app.get('/companies', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM company");
        res.json(rows);
        conn.release();
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || "Internal server error"
        });
    }
});


/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Returns all customers
 *     description: Retrieve a list of all customers.
 *     responses:
 *       200:
 *         description: A list of customers.
 *       500:
 *         description: Internal server error.
 */

app.get('/customers', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM customer");
        res.json(rows);
        conn.release();
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || "Internal server error"
        });
    }
});

/**
 * @swagger
 * /company:
 *   post:
 *     description: Create a company
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: company
 *         description: Company to be created
 *         in:  body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Company'
 *     responses:
 *       200:
 *         description: "Successful Operation"
 *       400:
 *         description: "Bad Request"
 *       500:
 *         description: "Error"
 */
app.post('/company', [
    // Validate and Sanitize input
    body('COMPANY_ID').notEmpty().trim().escape().withMessage('COMPANY_ID is required'),
    body('COMPANY_NAME').notEmpty().trim().escape().withMessage('COMPANY_NAME is required'),
    body('COMPANY_CITY').notEmpty().trim().escape().withMessage('COMPANY_CITY is required')
], async function (req, res) {
    res.header('Content-Type', 'application/json');
    // Validate and Sanitize input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {
        let conn;
        try {
            conn = await pool.getConnection();
            let req_body = req.body;
            await conn.query("INSERT INTO company VALUES (?, ?, ?)", [req_body.COMPANY_ID, req_body.COMPANY_NAME, req_body.COMPANY_CITY]);
            res.status(200).end();
        } catch (err) {
            console.log(err);
            res.status(400).json({
                'error': err
            });
        } finally {
            if (conn) return conn.end();
        }
    }
});

/**
 * @swagger
 * /company/{COMPANY_ID}:
 *   patch:
 *     description: Update company name
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: COMPANY_ID
 *         description: Id of company getting updated
 *         in:  path
 *         required: true
 *         type: string
 *       - name: companyName
 *         description: Company to be updated
 *         in:  body
 *         required: true
 *         schema:
 *           type: 'object'
 *           properties:
 *             COMPANY_NAME:
 *               type: 'string'
 *           required:
 *             - COMPANY_NAME
 *     responses:
 *       200:
 *         description: "Successful Operation"
 *       400:
 *         description: "Bad Request"
 *       500:
 *         description: "Error"
 */

app.patch('/company/:COMPANY_ID', [
    // Validate and Sanitize input
    param('COMPANY_ID').not().isEmpty().trim().escape(),
    body('COMPANY_NAME').not().isEmpty().trim().escape(),
], async function (req, res) {
    res.header('Content-Type', 'application/json');
    console.log(req.body);
    console.log(req.params.COMPANY_ID);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {
        let conn;
        try {
            conn = await pool.getConnection();
            let req_body = req.body;
            console.log(req_body.COMPANY_NAME);
            console.log(req.params.COMPANY_ID);
            const rows = await conn.query("UPDATE company SET COMPANY_NAME=? WHERE COMPANY_ID=?", [req_body.COMPANY_NAME, req.params.COMPANY_ID]);
            if (rows.affectedRows == 0) {
                res.status(400).json({
                    'error': 'Invalid company Id supplied'
                });
            } else {
                res.status(200).end();
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({
                'error': err
            });
        } finally {
            if (conn) return conn.end();
        }
    }
});

/**
 * @swagger
 * /customer/{CUST_CODE}:
 *   patch:
 *     summary: Update customer information
 *     description: Update the name of a customer identified by their code.
 *     parameters:
 *       - in: path
 *         name: CUST_CODE
 *         description: Code of the customer to be updated
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: customer
 *         description: Updated customer information
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             CUST_NAME:
 *               type: string
 *               description: The updated name of the customer
 *     responses:
 *       200:
 *         description: Customer information updated successfully
 *       400:
 *         description: Invalid request body or parameters
 *       500:
 *         description: Internal server error
 */
app.patch('/customer/:CUST_CODE', [
    // Validate and Sanitize input
    param('CUST_CODE').not().isEmpty().trim().escape(),
    body('CUST_NAME').not().isEmpty().trim().escape(),
], async function (req, res) {
    res.header('Content-Type', 'application/json');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {
        let conn;
        try {
            conn = await pool.getConnection();
            let req_body = req.body;
            const rows = await conn.query("UPDATE customer SET CUST_NAME=? WHERE CUST_CODE=?", [req_body.CUST_NAME, req.params.CUST_CODE]);
            if (rows.affectedRows == 0) {
                res.status(400).json({
                    'error': 'Invalid Customer code supplied'
                });
            } else {
                res.status(200).end();
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({
                'error': err
            });
        } finally {
            if (conn) return conn.end();
        }
    }
});



/**
 * @swagger
 * /company/{COMPANY_ID}:
 *   put:
 *     description: Update the entire company object
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: COMPANY_ID
 *         description: Id of company getting updated
 *         in:  path
 *         required: true
 *         type: string
 *       - name: company
 *         description: Company to be updated
 *         in:  body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/CompanyPutRequest'
 *     responses:
 *       200:
 *         description: "Successful Operation"
 *       400:
 *         description: "Bad Request"
 *       500:
 *         description: "Error"
 */
app.put('/company/:COMPANY_ID', [
    // Validate and Sanitize input
    param('COMPANY_ID').not().isEmpty().trim().escape(),
    body('COMPANY_NAME').not().isEmpty().trim().escape(),
    body('COMPANY_CITY').not().isEmpty().trim().escape()
], async function(req, res) {
    res.header('Content-Type', 'application/json');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {
        let conn;
        try {
            conn = await pool.getConnection();
            let req_body = req.body;
            const rows = await conn.query("UPDATE company SET COMPANY_NAME=?, COMPANY_CITY=? WHERE COMPANY_ID=?",
                [req_body.COMPANY_NAME, req_body.COMPANY_CITY, req.params.COMPANY_ID]);
            if (rows.affectedRows == 0) {
                res.status(400).json({
                    'error': 'Invalid company Id supplied'
                });
            } else {
                res.status(200).end();
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({
                'error': err
            });
        } finally {
            if (conn) return conn.end();
        }
    }
});

/**
 * @swagger
 * /company/{COMPANY_ID}:
 *   delete:
 *     description: Delete a company
 *     produces:
 *      - application/json
 *     parameters:
 *       - name: COMPANY_ID
 *         description: Id of company getting deleted
 *         in:  path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: "Successful Operation"
 *       400:
 *         description: "Bad Request"
 *       500:
 *         description: "Error"
 */
app.delete('/company/:COMPANY_ID', [
    // Validate and Sanitize input
    param('COMPANY_ID').not().isEmpty().trim().escape()
], async function(req, res) {
    res.header('Content-Type', 'application/json');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query("DELETE FROM company WHERE COMPANY_ID=?", [req.params.COMPANY_ID]);
            if (rows.affectedRows == 0) {
                res.status(400).json({
                    'error': 'Invalid company Id supplied'
                });
            } else {
                res.status(200).end();
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({
                'error': err
            });
        } finally {
            if (conn) return conn.end();
        }
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});