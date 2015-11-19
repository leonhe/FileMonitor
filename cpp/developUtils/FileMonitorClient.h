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
class FileMonitorClient
{
public:
    FileMonitorClient(){};
    ~FileMonitorClient(){};
    
    static FileMonitorClient* getInstance();
    static void destoryInstance();
    bool init();
    void connect(const char* host,const char* port);
    
    void getFileList();
    void loopReceiveFile();
    void excuteRecvList();
    
private:
    static FileMonitorClient* _instance;
    int sokt;
    std::thread _receiveThread;
    std::map<int,char*> reviceList_;
    std::mutex revice_mtx;
    std::string filename;
};
#endif /* FileMonitorClient_hpp */
