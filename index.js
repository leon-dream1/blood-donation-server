const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: "root",
//     password: '',
//     database: "blood_bank_db"
// });
const uri = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.PORT}/${process.env.DB_DATABASE_NAME}`
const connection = mysql.createConnection(uri);

// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE_NAME
// });

app.get('/', (req, res) => {
    res.send("Connection done");
})


connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err);
        return;
    }

    console.log('Connected to MySQL');

    //main work
   

    //add Donor/Patient
    app.post('/addUser', (req, res) => {
        const { name, email, password, role } = req.body;
        connection.query('INSERT INTO login (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role], (err, results) => {
            if (err) {
                res.send(false);
            }
            else {
                res.send(true);
            }
        }
        );
    })


    //verifyUser
    app.post('/verifyUser', (req, res) => {
        const userEmail = req.body.email;
        const userPassword = req.body.password;
    
        connection.query('SELECT name, email, role FROM login WHERE email=? AND password=?', [userEmail, userPassword], (err, results) => {
            res.send(results)
        }
        );
    })

    // Add a Donor Request
    app.post('/addDonorRequest', (req, res) => {

        const { Name, bloodGroup, unit, phone, address, disease, date, status } = req.body;
        const donor_email = req.body.email;

        connection.query('SELECT donor_name from donor_request WHERE donor_email= ? ', [donor_email], (err, results) => {
            if (results.length > 0) {
                res.send(false);
            }
            else {
                connection.query('Insert Into donor_request (donor_name, donor_email, donor_blood_group, unit, donor_phone, donor_address, donor_disease, date, status ) VALUES (?, ?, ?,?, ?, ?, ?, ?, ?)', [Name, donor_email, bloodGroup, unit, phone, address, disease, date, status], (err, results) => {
                    res.send(true);
                })
            }
        })
    })

    // Donor Request from Donor
    app.post('/getDonorRequest', (req, res) => {
        const donorEmail = req.body.email;
        connection.query('SELECT * FROM donor_request WHERE donor_email = ?', [donorEmail], (err, results) => {
            res.send(results);
        })
    })

    // Donor Dashboard
    app.post('/getDonorRequestFromDashboard', (req, res) => {
        const donorEmail = req.body.email;
        connection.query('SELECT * FROM donor_request WHERE donor_email = ? AND status =?', [donorEmail, 1], (err, results) => {
            //console.log(results);
            res.send(results);
        })
    })


    // Donor Request From admin
    app.get('/allDonorRequest', (req, res) => {
        connection.query('SELECT * FROM donor_request WHERE status=?', [0], (err, results) => {
            res.send(results);
        })
    })

    //Update Status
    app.post('/updateStatus', (req, res) => {
        const donor_email = req.body.email;
        const unit = req.body.unit;
        const bloodGroup = req.body.blood_group;
        const status = req.body.status;

        connection.query('UPDATE donor_request SET status = ? WHERE donor_email = ?', [status, donor_email], (err, results) => {

            connection.query('SELECT total from available_blood WHERE blood_group=?', [bloodGroup], (err, results) => {
               
                const total = results[0].total;
                connection.query('UPDATE available_blood SET total=? WHERE blood_group=?', [(total + Number(unit)), bloodGroup]), (err, results) => {
                    
                    connection.query('SELECT * FROM donor_request WHERE status NOT IN (?)', [status], (err, results) => {
                        res.send(results);
                    })
                }
            })
        })
    })

    //Delete Donor
    app.delete('/deleteDonor/:email', (req, res) => {
        const deleteEmail = req.params.email;

        connection.query('DELETE FROM donor_request WHERE donor_email= ?', [deleteEmail], (err, results) => {
            
        })
    })

    //Ger all donor
    app.get('/allDonor', (req, res) => {
        connection.query('SELECT * FROM donor_request WHERE status=?', [1], (err, results) => {
            res.send(results);
        })
    })


    // get available Blood
    app.get('/availableBlood', (req, res) => {
        connection.query('SELECT * FROM available_blood', (err, results) => {
            res.send(results);
        })
    })


 app.post('/findDonor', (req, res) => {
    const bloodGroup = req.body.bloodGroup;
    connection.query('SELECT * FROM donor_request WHERE donor_blood_group=? AND status=?', [bloodGroup, 1], (err, results) => {
        res.send(results);
    })
 })

//From Patient Page
 app.post('/addPatientRequest', (req, res) => {
    const {donor_name, donor_phone, patient_name, patient_email, patient_unit, bloodGroup, address} = req.body;
    
    connection.query('SELECT patient_name from patient_request WHERE patient_email= ? ', [patient_email], (err, results) => {
        if (results.length > 0) {
            res.send(false);
        }
        else {
            connection.query('Insert Into patient_request (patient_name,patient_email, patient_blood_group, patient_blood_unit, donor_name , donor_phone, status) VALUES (?, ?, ?,?, ?, ?, ?)', [patient_name, patient_email, bloodGroup, patient_unit, donor_name, donor_phone, 0], (err, results) => {
                res.send(true);
            })
        }

    })
 })


 app.post('/getPatientRequest', (req, res) => {
    const patientEmail = req.body.email;
        connection.query('SELECT * FROM patient_request WHERE patient_email = ?', [patientEmail], (err, results) => {
            res.send(results);
        })
 })


 app.post('/getPatientRequestFromDashboard', (req, res) => {
    const patientEmail = req.body.email;
        console.log("Email", patientEmail);
        connection.query('SELECT * FROM patient_request WHERE patient_email = ? AND status =?', [patientEmail, 1], (err, results) => {
            res.send(results);
        })
 })

//From Admin
 app.get('/allPatientRequest', (req, res) => {
    connection.query('SELECT * FROM patient_request WHERE status=?', [0], (err, results) => {
        res.send(results);
    })
 })


 app.post('/updatePatientStatus', (req, res) => {
    const patient_email = req.body.email;
        const unit = req.body.unit;
        const bloodGroup = req.body.blood_group;
        const status = req.body.status;

        connection.query('UPDATE patient_request SET status = ? WHERE patient_email = ?', [status, patient_email], (err, results) => {

            connection.query('SELECT total from available_blood WHERE blood_group=?', [bloodGroup], (err, results) => {
               
                const total = results[0].total;
                connection.query('UPDATE available_blood SET total=? WHERE blood_group=?', [(total - Number(unit)), bloodGroup]), (err, results) => {
                    
                    connection.query('SELECT * FROM patient_request WHERE status NOT IN (?)', [status], (err, results) => {
                        res.send(results);
                    })
                }

            })
        })
 })


 app.delete('/deletePatient/:email', (req, res) => {
    const deleteEmail = req.params.email;

    connection.query('DELETE FROM patient_request WHERE patient_email= ?', [deleteEmail], (err, results) => {

    })
})

app.get('/allPatient', (req, res) => {
    connection.query('SELECT * FROM patient_request WHERE status=?', [1], (err, results) => {
        res.send(results);
    })
})


});




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})