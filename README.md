# Accessible Connect

This repository contains code for Accessible Connect (also referred as 'Jod'), a Videoconferencing Platform for Mixed Hearing Groups.

## Folder Structure
* `.vscode`: Extentsion settings for VSCode
* [`client`](/client/README.md): Contains client code written in React
* [`server`](/server/README.md): Server code written in node and express
* [`shared`](/shared/README.md): Contains code and abstractions which are shared by both client and server

## Notes on Packages
### communication-calling-1.7.0-beta.1.tgz
* Screenshare and Transcriptipn (beta feature) works

## Setup

Jod uses Azure Communication Services that requires a call ID. Follow these steps to create one. 

```
cd experiment-setup
npm i
node start:dev
```

From root folder:
```
npm setup
```

To start client:
```
cd client
npm start
```

To start server:
```
cd server
npm start:dev
```

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
