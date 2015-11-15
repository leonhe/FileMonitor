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
//    FileUtils::getInstance()->getWritablePath();
    
    
    _receiveThread = std::thread(std::bind( &FileMonitorClient::loopReceiveFile, this));
//    CCLOG("DSA");
    const char buf[]="Hello";
   ssize_t len=send(sokt, buf, strlen(buf),0);
    if (len==-1) {
        std::cout<<("发送消息失败")<<std::endl;
        return;
    }
    
}

void FileMonitorClient::loopReceiveFile()
{
    while(true)
    {
        //读取数据长度
        const ssize_t SIZE_TYPE_LEN = sizeof(int)+1;
        char data_size_buff[SIZE_TYPE_LEN];
        memset(&data_size_buff,0,SIZE_TYPE_LEN);
        ssize_t len = recv(sokt,(&data_size_buff),SIZE_TYPE_LEN-1,0);
        int er=errno;
        if(er>0)
        {
            std::cout<<strerror(er)<<std::endl;
            break;
        }

        unsigned int data_size =0;
        if(len>0)
        {
            memcpy((&data_size),(&data_size_buff),SIZE_TYPE_LEN-1);
            std::cout<<"接收到的包长度:"<<data_size<<std::endl;
        }
        if(len==SIZE_TYPE_LEN-1)
        {
            char buf[MAX_BUFF_SIZE];
            ssize_t len=recv(sokt,(&buf),MAX_BUFF_SIZE, 0);
            int er=errno;
            if(er>0)
            {
                std::cout<<(strerror(er))<<std::endl;
                break;
            }
            if (len>0) {
                std::cout<<(buf)<<std::endl;
            }
        }


//        delete [] buf;
//        buf=nullptr;
    }
    
}
