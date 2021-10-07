import React, {useState, useEffect, useRef} from 'react';

import Paper from '@mui/material/Paper'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import SpeedDialIcon from '@mui/material/SpeedDialIcon'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'

import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

import Backdrop from '@mui/material/Backdrop'

import {initializeApp} from 'firebase/app';
import {getDatabase, ref, onValue, get, set, remove} from "firebase/database";


const columns = [
  {id: 'sid', label: 'SID', minWidth: 100},
  {id: 'name', label: 'Name', minWidth: 200},
  {id: 'gpa', label: 'GPA', minWidth: 100, align: 'right', format: (value)=> value.toFixed(2),},
];

function createData(sid, name, gpa) {
  return {sid, name, gpa};
}


const config = {
  apiKey: "AIzaSyCR7WO1M5ali-ftnsTf_1uQ1VY-Y9LYJOE",
  authDomain: "ta-416-training.firebaseapp.com",
  databaseURL: "https://ta-416-training-default-rtdb.firebaseio.com",
  projectId: "ta-416-training",
  storageBucket: "ta-416-training.appspot.com",
  messagingSenderId: "754268442077",
  appId: "1:754268442077:web:17d1df6087d83c2ff8fa34"
};

const firebaseApp = initializeApp(config);

const rows = []

export default function App() {

  const [refreshKey, setRefreshKey] = useState(0)

  const [data, setData] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [sid, setSID] = useState(0)
  const [name, setName] = useState("")
  const [gpa, setGPA] = useState(0.0)

  const [invalidInput, setInvalidInput] = useState(false)

  const [mode, setMode] = useState("")

  const editGPARef = useRef()
  const editNameRef = useRef()
  const editSIDRef = useRef()

  const saveNameRef = useRef()


  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const rf = ref(db, "Students/");
    onValue(rf, snapshot => {
      rows.length = 0;
      snapshot.forEach(e => {
        rows.push(createData(e.val().SID, e.key, e.val().GPA))
      })
      rows.sort((a,b) => (a.sid > b.sid) ? 1 : - 1)
      console.log(rows)
      setData(rows)
    });

  }, [refreshKey])

  const handleClose = () => {
    setOpen(false)
    setInvalidInput(false)
  }

  const cellClicked = e => {
    let sid = ""
    let name = ""
    let gpa = ""
    if (e.target.nextSibling === null) {
      //we're looking at GPA
      gpa = e.target.innerHTML;
      name = e.target.previousSibling.innerHTML;
      sid = e.target.previousSibling.previousSibling.innerHTML;
    } else if (e.target.previousSibling === null){
      //we're looking at SID
      sid = e.target.innerHTML;
      name = e.target.nextSibling.innerHTML;
      gpa = e.target.nextSibling.nextSibling.innerHTML;
    } else {
      sid = e.target.previousSibling.innerHTML;
      name = e.target.innerHTML;
      gpa = e.target.nextSibling.innerHTML;
      //we're looking at Name
    }
    setGPA(parseFloat(gpa))
    setSID(parseInt(sid))
    setName(name)

    setMode("Edit Student")
    setEditing(true)
    setOpen(true)
  }

  const deletePressed = async () => {

    const deleteStudent = async () => {
      const db = getDatabase(firebaseApp)
      const rf = ref(db, "Students/" + name)
      let resp = await remove(rf)
    }
    deleteStudent()
    setOpen(false)
    setInvalidInput(false)
    setRefreshKey(oldKey => oldKey + 1)
  }

  const savePressed = async () => {
    let tsid = ""
    let tname = ""
    let tgpa = ""


    if (editing) {
      //editing
      tsid = sid
      tname = name
      tgpa = editGPARef.current.value

      if (tname === "" || tgpa === "") {
        setInvalidInput(true)
        return
      }
    }else {
      //creating
      tname = saveNameRef.current.value
      tgpa = editGPARef.current.value

      if (tname === "" || tgpa === "") {
        setInvalidInput(true)
        return
      }

      const getID = async () => {
        const db = getDatabase(firebaseApp);
        const rf = ref(db, "ID_Count/value");
        tsid = await get(rf).then((snapshot) => {
          if (snapshot.exists()) {
            tsid = snapshot.val()
            return snapshot.val()
          }
        })
      }
      await getID()

      const updateID = () => {
        const db = getDatabase(firebaseApp)
        const rf = ref(db, "ID_Count/")
        set(rf, {
          value: tsid+1
        })
      }
      updateID()
    }
    const writeData = () => {
      const db = getDatabase(firebaseApp)
      const rf = ref(db, "Students/" + tname)
      set(rf, {
        SID: tsid,
        GPA: tgpa
      })
    }
    writeData()
    setRefreshKey(oldKey => oldKey + 1)
    setOpen(false)
    setInvalidInput(false)
    console.log(tsid + " " + tname + " " + tgpa)
  }

  const addPressed = () => {
    setMode("Add Student")
    setEditing(false)
    setGPA(null)
    setOpen(true)
  }

    return (
        <Paper sx={{margin:'auto', marginTop:'50px', width:'90%', overflow:'hidden'}}>
        <IconButton
          onClick={addPressed}
          sx={{position: 'absolute', bottom: 16, right: 16}}
        >
          <SpeedDialIcon/>
        </IconButton>
        <Backdrop
          sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
          open={open}
          />
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>{mode}</DialogTitle>
          <DialogContent>
            <Stack padding="5px" direction="row" alignItems="baseline" spacing={2}>
            {editing && <label ref={editSIDRef}>SID: {sid}</label>}
            {editing && <label ref={editNameRef}>{name}</label>}
            {!editing && <TextField
              error={invalidInput}
              inputRef={saveNameRef}
              variant="standard"
              size="small"
              label="Name"
            />}
            <TextField
            error={invalidInput}
            variant="standard"
            label="GPA"
            size="small"
            defaultValue={gpa}
            inputRef={editGPARef}
            />
            </Stack>
            </DialogContent>
            <DialogActions>
              {editing && <Button variant="contained" onClick={deletePressed} color="error">Delete</Button>}
              <Button onClick={savePressed} variant="contained">{editing ? "Save" : "Create"}</Button>
            </DialogActions>
          </Dialog>
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.sid}
                      align={column.align}
                      style={{minWidth: column.minWidth}}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => {
                  return (
                    <TableRow onClick={cellClicked}>
                      {columns.map((column) => {
                        const value = row[column.id]
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format && typeof value === 'number'
                              ? column.format(value)
                              : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
    );


}
