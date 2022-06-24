# Question 1
In order to put this project into production, you will need to be able to:
* versionate the base code (with Git)
* develop a CI/CD process (with GitLab) to generate a pipeline that will execute all changes
* develop an Ingress config to expose the routes
* build a container of the app (with Docker)
* store the container (with AWS ECR)
* deploy on a cluster, scale and run that container (with Kubernetes and Helm)
* handle dynamically the config elements (databases secrets, S3 bucket paths) and the Kubernetes resources with the Helm chart
* provision dynamically the infrastructure you will need (servers, clusters, RDS)
* monitor your application (with an APM provided by Datadog)
* secure you application with JWT authentication

# Question 2
There are several possibilities here.
* In order to automate that process, you can create a cronjob. With Kubernetes, you could schedule a daily cronjob that will trigger the populate endpoint with a cURL command. The inconvenient is the fact that you need to be sure that the files are uploaded by the time the cronjob is triggered.

* We can think about an event-driven application (a websocket server for instance). We can run the populate logic only when the S3 file is uploaded by the data team. Using AWS lambda, we can trigger an event to update the database once the objects have been updated in the S3 buckets. So our websocket server can received a simple message and launch the populate logic to update the database.

# Question 3
If there is a way to get the top 100 games directly from store/platform providers (Apple and Google), we can withdraw the phase of uploading to S3 from the process.
Our app can interrogate the providers API and update the data in database.
For the database schema, I think about those changes: 
```javascript
{
    publisherId: {
        type: DataTypes.INTEGER(9).UNSIGNED,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    platform: {
        type: DataTypes.ENUM("ios", "android"),
        allowNull: false
    },
    storeId: {
        type:DataTypes.INTEGER(10).UNSIGNED
        allowNull: false
    },
    bundleId: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    appVersion: { 
        type: DataTypes.STRING(10)
    },
    isPublished: { 
        type: DataTypes.BOOLEAN, 
        default: false
    }
}
```