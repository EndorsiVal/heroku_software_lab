from flask import Flask, redirect, url_for, request, send_from_directory, jsonify
import os, json
import MongoHandler
import hardwareSet
import User
import Project
import sys

app = Flask(__name__, static_url_path='', static_folder='SoftwareLabProject/build/')
#TODO: route everything correctly

mongo = MongoHandler.DataHandler()

@app.route('/')
def index():
    return send_from_directory('SoftwareLabProject/build/', 'index.html')

@app.route('/login', methods= ['POST'])
def LoginRequest():
    request_data = request.get_json()
    print(request_data, file=sys.stderr)
    
    user_id = request_data['userID']
    password = request_data['password']
    
    if mongo.verify_user_exists(user_id) is False:
        return jsonify({'confirmation':'User Doesn\'t Exist'})
    
    if mongo.verify_login(user_id, password) is False:
        return jsonify({'confirmation':'Password is Incorrect'})
    # if(request_data['userID'] == '1234'): # just checking if data can be read UserID 1234 will trigger this
    #     return jsonify({'confirmation': "1234 recieved successfully"})
    
    return jsonify({'confirmation':"Data Recieved!"})

@app.route('/registration', methods=['POST'])
def RegistrationRequest():
    request_data = request.get_json()
    print(request_data, file=sys.stderr)
    
    username = request_data['username']
    user_id = request_data['userID']
    password = request_data['password']
    confirm_password = request_data['confirmPassword']
    
    if( (username == "") or (user_id == "") or (password == "") or (confirm_password == "") is True):
        return jsonify({'confirmation':"BLANK"});
    
    if(password != confirm_password):
        return jsonify({'confirmation': "WRONG_PASSWORD"})
    
    if(mongo.verify_user_exists(user_id) is True):
        return jsonify({'confirmation':"USER_EXISTS"})
    
    user = User.User(username,user_id,password)
    
    if mongo.create_user(user) is False:
        return jsonify({'confirmation': "USER_CREATION_FAILED"})
        
    return jsonify({'confirmation':"USER_CREATION_SUCCESS"})
    
@app.route('/getProjects', methods = ['POST'])
def Projects_List_Request():
    request_data = request.get_json()
    print(request_data, file=sys.stderr)
    
    user_id = request_data['userID']
    #testProjects('111', 'hello', 'world')
    project_array = mongo.get_all_projects_by_ID(user_id)
    capacity_1 = mongo.get_capacity(0)
    capacity_2 = mongo.get_capacity(1)
    data = []
    for project in project_array:
        data.append({'name': project.get_name(), 'hardware': project.get_hardware(), 'capacity': [capacity_1, capacity_2], 'ID': project.get_ID()})
    print(data, file=sys.stderr)
        
    
    
    return jsonify(data)

def testProjects(user_id, username, password,):
    user_1 = User.User(username, user_id, password)
    mongo.create_user(user_1)
    Project_1 = Project.Project('Project_One','000','test one', [user_1],{'hw1':50,'hw2':100})
    Project_2 = Project.Project('Project_TWO','001','test two', [user_1],{'hw1':100,'hw2':200})
    Project_3 = Project.Project('Project_THREE','002','test three', [user_1],{'hw1':75,'hw2':300})
    
    if mongo.create_project(Project_1) is True:
        print('project 1 created', file=sys.stderr)
    if mongo.create_project(Project_2) is True:
        print('project 2 created', file=sys.stderr)
    if mongo.create_project(Project_3) is True:
        print('project 3 created', file=sys.stderr)
        
    mongo.add_user_to_project('000', user_1)
    mongo.add_user_to_project('001', user_1)
    mongo.add_user_to_project('002',user_1)
    
    if mongo.is_user_in_project(user_id, '000') is True:
        print('user is in project 1', file=sys.stderr)
        
    if mongo.is_user_in_project(user_id, '001') is True:
        print('user is in project 2', file=sys.stderr)
    
    if mongo.is_user_in_project(user_id, '002') is True:
        print('user is in project 3', file=sys.stderr)
        


@app.route ('/hardwarecheck', methods = ['POST'])
def hardwarecheck():
    request_data = request.get_json()
    print(request_data, file=sys.stderr)
    
    command = request_data['command']
    quantity = float(request_data['quantity'])
    project_ID = request_data['project_ID']
    number = request_data['number']
    
    if(command == 'checkin'):
        mongo.check_in_hardware(project_ID, number, quantity)
        return jsonify({'confirmation': 'hardware checked-in successfully'})
    
    mongo.checkout_hardware(project_ID, number, quantity)
    return jsonify({'confirmation': 'hardware checkedout successfully'})
    


@app.route('/user/<username>')
def queryUser(username):
    mongo = MongoHandler()
    isAUser = mongo.verifyUserExists(username)
    if isAUser:
        return redirect(url_for('user_page'))
    else:
        mongo.createUser(username)

@app.route('/project/<id>')
def getProject():
    pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))
