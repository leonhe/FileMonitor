//
//  FileMonitorClient.cpp
//  SPYOnline
//
//  Created by Yuanfei He on 15/11/12.
//
//

#include "FileMonitorClient.h"

#include <netdb.h>
#include <sys/socket.h>
#include <fcntl.h>
#include <netdb.h>
#include <string>
#include <iostream>
#include <thread>
#include <functional>
#include <sys/errno.h>
#include <fstream>

FileMonitorClient* FileMonitorClient::_instance = nullptr;

#define MAX_BUFF_SIZE 4096


FileMonitorClient* FileMonitorClient::getInstance()
{
    if (_instance==nullptr) {
        _instance = new FileMonitorClient();
        if (!_instance->init()) {
            FileMonitorClient::destoryInstance();
            return nullptr ;
        }
    }
    return _instance;
}


void FileMonitorClient::destoryInstance()
{
    delete FileMonitorClient::_instance;
    FileMonitorClient::_instance=nullptr;
    
}

bool FileMonitorClient::init()
{
    
    return true;
}


void FileMonitorClient::connect(const char* host,const char* port)
{
    
    struct addrinfo hints;
    struct addrinfo *servinfo;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    
    int status = getaddrinfo(host,port, &hints, &servinfo);
    if(status!=0 || servinfo==NULL)
    {
        std::cout<<"服务器地址信息不正确,请重新确认后连接！"<<std::endl;
        return;
    }
    
    sokt = socket(servinfo->ai_family, servinfo->ai_socktype, servinfo->ai_protocol);
    if(sokt==-1)
    {
        std::cout<<"socket connect fail！"<<std::endl;
        freeaddrinfo(servinfo);
        return;
    }
    //    fcntl(sokt, F_SETFL,O_NONBLOCK);
    
    //    sem_t *my_sem;
    //    my_sem = sem_open("/myseml", O_CREAT,0664,0);
    //    sem_init(my_sem, 0, 1);
    
    int result= ::connect(sokt, servinfo->ai_addr, servinfo->ai_addrlen);
    if(result!=-1)
    {
        this->getFileList();
        
    }else{
        std::cout<<"sockect close"<<std::endl;
    }
    
    freeaddrinfo(servinfo);
}


void FileMonitorClient::getFileList()
{
    _receiveThread = std::thread(std::bind( &FileMonitorClient::loopReceiveFile, this));
    _receiveThread.detach();
//    CCLOG("DSA");
    const char buf[]="Hello";
   ssize_t len=send(sokt, buf, strlen(buf),0);
    if (len==-1) {
        std::cout<<("发送消息失败")<<std::endl;
        return;
    }
    
}

void FileMonitorClient::getFileData()
{
    
    std::fstream ifs;
    ifs.open(filename,std::ifstream::in);
    std::string data;
    while (getline(ifs,data)) {
//        std::cout<<data<<"data"<<std::endl;
        int command = 1004;
        char buf[512];
        memset(&buf, 0, 512);
        memcpy(&buf, (void*)(&command), sizeof(int));
        memcpy((&buf)+sizeof(int), data.c_str(), data.size());
        std::cout<<buf<<std::endl;
    }
    ifs.close();
}


void FileMonitorClient::excuteRecvList()
{
    revice_mtx.lock();
    for (auto recv_it=reviceList_.begin(); recv_it!=reviceList_.end(); ++recv_it) {
        int command = recv_it->first;
        const char* data_buf = recv_it->second;
        if (command==1000)
        {
            std::fstream fs;
            fs.open(data_buf,std::fstream::in | std::fstream::out | std::fstream::app);
            filename=data_buf;
            fs.close();
        }else if (command==1001){
            std::fstream fs;
            fs.open(filename.c_str(),std::fstream::in | std::fstream::out | std::fstream::app);
            fs<<data_buf;
            fs.close();
            this->getFileData();
        }
        
//        std::cout<<"command:"<<command<<" data:"<<data_buf<<std::endl;
        delete [] data_buf;
        data_buf=nullptr;
    }
    reviceList_.clear();
    revice_mtx.unlock();
    
}

void FileMonitorClient::loopReceiveFile()
{
    while(true)
    {
        //读取命令
        int command = 0;
        ssize_t recv_len=recv(sokt, &command, sizeof(int), 0);
        //读取数据长度
        ssize_t data_size =0;
        recv_len = recv(sokt,(&data_size),sizeof(int),0);
        int er=errno;
        if(er>0)
        {
            std::cout<<strerror(er)<<std::endl;
        }
        if(!data_size) continue;
        
        std::cout<<"接收到的包长度:"<<data_size<<std::endl;
        recv_len=0;
        char *buf=new char[data_size+1]{0};
        while (recv_len<data_size)
        {
            recv_len=recv(sokt, buf+recv_len, data_size-recv_len, 0);
            
        }
        std::string str(buf);
        revice_mtx.lock();
        reviceList_[command] = buf;
        revice_mtx.unlock();
//        delete [] buf;
    }
    
}
