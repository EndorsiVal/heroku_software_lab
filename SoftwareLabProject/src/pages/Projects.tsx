import React from 'react';
import './../App.css'
import {useNavigate, useLocation} from 'react-router-dom';
import { Button, Grid, TextField} from '@material-ui/core';
import { BorderAllOutlined, FirstPage } from '@material-ui/icons';
import { stringify } from 'querystring';

function Projects(){
    const navigate = useNavigate();
    const {state} = useLocation();
    const {ID, USERNAME} = state;
    
    interface project_type{
        name: string;
        hardware: number[];
        capacity: number[];
        ID: number|string;
    }
    const [projects, setProjects] = React.useState<project_type[] | null>([]);
    const [totalFree_1, setTotalFree_1] = React.useState<number>(0); //total number thats taken by all projects
    const [totalFree_2, setTotalFree_2] = React.useState<number>(0);

    React.useEffect(() => { //initial render

        function getProjects(ID: any){ //gets list of projects
            if(ID === undefined){
                console.log("NO ID? UNDEFINED");
                return [];
            }
    
            fetch('/getProjects', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({'userID':ID}),
              })
              .then((response) => response.json())
              .then((data)=>{
                console.log(data);
                const list: project_type[] = [];
                //counter for hardware
                let count_hardware_1: number = 0;
                let count_hardware_2: number = 0;

                data.forEach((project: project_type) =>{
                    count_hardware_1 += project.hardware[0];
                    count_hardware_2 += project.hardware[1];
                    list.push({'name':project.name,'hardware':project.hardware, 'capacity': project.capacity, 'ID': project.ID})
                })
                //sets total hardware available 
                setTotalFree_1(count_hardware_1);
                setTotalFree_2(count_hardware_2);
                console.log(` total free: ${totalFree_1} ${totalFree_2}`);
                setProjects(list);
                
    
              })
              .catch((error)=>{
                if(error.response){
                    console.log(error);
                    console.log(error.response.statuts);
                    console.log(error.response.headers);
                  }
              })
          }

        const projectlist = getProjects(ID);
        console.log(`hello heres data from ${projectlist}`);
        
      }, [ID]);


      
    return( //dynamic rendering based off of list named 'projects'
        <div className='App'>
            <div style = {{display:'inline-flex', float:'left', marginLeft:20}}>
                {USERNAME === 'loginUser' ? <h1>Welcome {ID} !</h1> : <h1>Welcome {USERNAME} !</h1>}
            </div>
            { projects?.map((project: { name: any; }) => <Projectview key={project.name} project={project} total_1 = {[totalFree_1, setTotalFree_1]} total_2 = {[totalFree_2, setTotalFree_2]}/>) }
            <div style = {{display:'inline-flex', float:'right', margin:20}}>
                <Button variant = 'contained' color = 'primary' onClick = {()=> navigate('/')}> Sign Out</Button>
            </div>
        </div>
    );
}

function Projectview(props: any){
    // availability for hardware 1 and 2
    const [available_hardware_1, setHardware_1] = React.useState(Number(props.project.hardware[0])); 
    const [available_hardware_2, setHardware_2] = React.useState(Number(props.project.hardware[1]));
    
    //keep track of values in textfields
    const [quantity_1, setQuantity_1] = React.useState(0);
    const [quantity_2, setQuantity_2] = React.useState(0);

    const project_ID: string|number = props.project.ID;


    //handle to know which set its referring to
    const handleHardware_1 = (event:any) => {   
        setQuantity_1(event.target.value);
        
    }

    const handleHardware_2 = (event:any) => {
        setQuantity_2(event.target.value);
    }


    const checkin_button = (number: number) => {
        let quantity = 0;
        let available = 0;
        let capacity = 0;
        if (number === 1){
            quantity = quantity_1;
            capacity = props.project.capacity[0];
            available = props.total_1[0];
        }
        else{
            quantity = quantity_2;
            capacity = props.project.capacity[1];
            available = props.total_2[0]
        }
        console.log(`available: ${available} quantity: ${quantity} capacity: ${capacity} number: ${number}`);
        if(available + quantity < capacity){
            console.log('api fetched');
            fetch_hardware_check("checkin", quantity, number-1);
        }
        

        
    }

    const checkout_button = (number: number) => {
        let quantity = 0;
        let available = 0;
        let capacity = 0;

        if(number === 1){
            quantity = quantity_1;
            capacity = props.project.capacity[0];
            available = props.total_1[0];
        }
        else{
            quantity = quantity_2;
            capacity = props.project.capacity[1];
            available = props.total_2[1];
        }

        if(available - quantity > -1){
            fetch_hardware_check("checkout", quantity, number-1);
        }
        

    }  

    function fetch_hardware_check(command: string, quantity: number, number: number){
        const data = {'command': command, 'quantity': quantity, 'project_ID': project_ID, 'number': number}
        fetch('/hardwarecheck', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
          .then((response) => response.json())
          .then((data) =>{
            console.log(data);

                if(data.confirmation === 'hardware checked-in successfully'){ //checking in
                    console.log("check in");
                    if(number === 0){
                        const displayquantity = Number(quantity)+Number(available_hardware_1);
                        const set = props.total_1[1];
                        set(Number(props.total_1[0]) + Number(quantity));
                        setHardware_1(displayquantity);
                    }
                    else{
                        const set = props.total_2[1];
                        set(Number(props.total_2[0]) + Number(quantity));
                        const displayquantity = Number(quantity)+Number(available_hardware_2);
                        setHardware_2(displayquantity);
                    }
                }
                else{ //checking out
                    console.log("check out");
                    if(number === 0){
                        const set = props.total_1[1];
                        set(props.total_1[0] - quantity);

                        setHardware_1(available_hardware_1-quantity);
                    }
                    else{
                        const set = props.total_2[1];
                        set(props.total_2[0] - quantity);

                        setHardware_2(available_hardware_2-quantity);
                    }
                }
          })
          .catch((error) =>{
            if(error.response){
                console.log(error);
                console.log(error.response.statuts);
                console.log(error.response.headers);
              }
          })
    }

    //UI for one project
    return(<div>
        <Grid container spacing = {2} justifyContent = "flex-start" style = {{flexDirection:'row', borderBlockStyle: 'solid', height: '160px'}}>
            <Grid item xs = {4} sm = {2} style = {{margin:0}}>
                <h2> {props.project.name}</h2>
            </Grid>
            <Grid item xs = {4} sm = {2} justifyContent = "center" style = {{flexDirection: 'column', padding:'30px'}}>
                <h3 style = {{'whiteSpace': 'nowrap'}}>HWSET1: {available_hardware_1}/{props.project.capacity[0]}</h3>
                <h3 style = {{'whiteSpace': 'nowrap'}}>HWSET2: {available_hardware_2}/{props.project.capacity[1]}</h3>
            </Grid>
            <Grid item xs = {4} sm = {2}  style = {{padding: 20 }}>
                <TextField  onChange = {handleHardware_1} variant = 'outlined' id = "hardwareset_1"  label = "Enter QTY" type = "number"  margin = "dense" >

                </TextField>
                <TextField onChange={handleHardware_2} variant = 'outlined' id = "hardwareset_2" label = "Enter QTY" type = "number" margin = "dense">

                </TextField>
            </Grid>
            <Grid item xs = {4} sm = {2}  style = {{flexDirection: 'column', padding:20}}>
                <Button onClick = {()=>checkin_button(1)} variant = "outlined" style = {{margin:10, width: '100%'}}> Check In</Button>
                <Button onClick = {()=> checkin_button(2)} variant = "outlined" style = {{margin:10, width: '100%'}}> Check In</Button>
            </Grid>

            <Grid item xs = {4} sm = {2} style = {{flexDirection: 'column', padding:20}}>
                <Button onClick = {()=> checkout_button(1)} variant = "outlined" style = {{margin:10, width: '100%'}}> Check Out</Button>
                <Button onClick = {()=> checkout_button(2)} variant = "outlined" style = {{margin:10, width: '100%'}}> Check Out</Button>
            </Grid>
            <Grid item xs = {4} sm = {2} justifyContent = "center" alignContent = "center" style = {{flexDirection: 'column', padding:50}}>
                <Button variant = "contained" color = "primary" style = {{height: '40px', width:'100%'}}> LEAVE </Button>
            </Grid>
        </Grid>
    </div>);
}

export default Projects;
