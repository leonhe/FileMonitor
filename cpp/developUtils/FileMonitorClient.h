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
    
private:
    static FileMonitorClient* _instance;
    int sokt;
    std::thread _receiveThread;
};
#endif /* FileMonitorClient_hpp */
