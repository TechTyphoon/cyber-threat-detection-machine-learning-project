Cyber Threat Detection Machine Learning Project

Overview

The project consists of two major components:

Frontend Project

Functionality: User interface to input Cyber Threat Detection features, submit the form, and get the predicted label for cyber attacks with probabilities from the backend.
Technologies Used:
HTML5
React.js (useState hook, Axios for API calls)
Backend Project

Functionality: API for predicting cyber attack labels using a trained machine learning model.

Technologies Used:

Python
Flask (API to serve the model)
Python Libraries: Flask, scikit-learn, pandas, numpy, matplotlib, pickle-mixin
Other Tools: Pipenv for virtual environment management, Docker for containerization
Scripts: notebook.ipynb, model.py, predict.py

Frontend Setup:

Steps to Set Up and Run the Frontend in local:

Open the project folder in Visual Studio Code.
Click on Terminal->New Terminal from the menu on the top.

Please proceed the following steps in the terminal (Navigate to the path of the project)

Eg: (base) PS C:\Users\user1\OneDrive\Desktop\cyber-threat-detection-machine-learning-project> - By default the path of the project will be displayed.

1. Install Required Software:

Install Node.js.

Verify installation:

  node -v
  npm -v

2. Initialize the Project:

  Navigate to the frontend project directory

  cd frontend

3. Install dependencies:

   npm install

4. Run the Development Server:

  Start the React development server

  npm run dev

  The frontend application should now be accessible at http://localhost:5173

  ![image](https://github.com/user-attachments/assets/2980d05e-dc60-4763-8369-36540dd134a6)

  UI will look as follows:

  ![image](https://github.com/user-attachments/assets/9b875238-2d14-4fe3-a629-70c2945ee748)


5. Key Dependencies:

   React.js: User interface components
   Axios: Library for making HTTP requests (for communicating with the Flask backend)

   (Note: If any error related to axios library being not accessible, kindly run this command in the terminal:  npm install axios. Then run frontend app by providing npm run dev)

Backend Setup:

Follow below steps to run backend app.

Click on Terminal->New Terminal from the menu on the top.

Please proceed the following steps in the terminal (Navigate to the path of the project)

Eg: (base) PS C:\Users\user1\OneDrive\Desktop\cyber-threat-detection-machine-learning-project> - By default the path of the project will be displayed.

Prerequesite : Install Required Software:

  Install Python (3.11 or later).

  Install pipenv using below command:

  pip install pipenv
       
1. Navigate to backend project folder

  cd backend

2. Steps to Create Pipfile and Pipfile.lock

  pip install -r requirements.txt

3. Verify the Pipenv Environment:

  Activate the virtual environment:

  pipenv shell

4. Confirm installation of dependencies:

  pip list

5. Deactivate the environment when done

  exit

6. Export Dependencies to Pipfile.lock:

The Pipfile.lock will be automatically generated when you run pipenv install.
Verify that it exists in the backend directory.

7. Steps to Dockerize the Backend

   Run the following command to build the Docker image: (from Dockerfile)

   Don't miss the . in the end of the below command. It denotes current directory :)

   docker build -t flask-predict-app .

   ![image](https://github.com/user-attachments/assets/5a9d6735-6cf9-4ac8-aa27-5f23303ae2ca)


9. Run the Docker Container:
   
  Start the Flask app inside the container:

  docker run -p 5002:5002 flask-predict-app

  ![image](https://github.com/user-attachments/assets/68088c08-fe2f-462f-8667-7a2888e93ad8)


9. Test the backend API : Ensure the backend is running at

    http://localhost:5002

   Use tools like Postman or the frontend React app to test the /predict endpoint.

   Example SOAP UI test screenshot for Flask API:

   ![image](https://github.com/user-attachments/assets/c7b448b6-8920-4d30-b018-8e69e6d2d999)


SUB PROJECTS' STRUCTURE:

  ![image](https://github.com/user-attachments/assets/1cbdd7b2-d7d4-447e-8c82-afdf98e65ebe)


Future Enhancements:

1. React JS UI enhancements
2. Model hyperparameter tuning to achieve greater accuracy

Wish you all the best :)




    





