//
//  FileMonitorClient.hpp
//  SPYOnline
//
//  Created by Yuanfei He on 15/11/12.
//
//

#ifndef FileMonitorClient_hpp
#define FileMonitorClient_hpp

#include <sys/socket.h>
#include <thread>
#include <map>
#include <string>
#include <mutex>
#include <vector>
class FileMonitorClient
{
public:
    FileMonitorClient():close_(true){};
    ~FileMonitorClient(){};
    
    static FileMonitorClient* getInstance();
    static void destoryInstance();
    bool init();
    void connect(const char* host,const char* port,bool isTest=false);
    
    void getFileList();
    void loopReceiveFile();
    void excuteRecvList();
    void getFileData();
    
    void sendData(std::string &command,const char* buf,ssize_t len);
    
   inline bool isClose(){return close_;}
    
private:
    static FileMonitorClient* _instance;
    int sokt;
    std::thread _receiveThread;
    std::map<int,char*> reviceList_;
    std::mutex revice_mtx;
    std::string filename;
    bool close_;
};
#endif /* FileMonitorClient_hpp */
